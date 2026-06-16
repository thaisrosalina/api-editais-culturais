import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const KEYWORDS = [
  'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição', 'inscricao',
  'prêmio', 'premio', 'bolsa', 'patrocínio', 'patrocinio', 'apoio',
  'cultura', 'cultural', 'artístico', 'artistico', 'audiovisual',
  'proac', 'leic', 'decentra', 'pnab', 'lei rouanet', 'lei paulo gustavo',
  'incentivo', 'terceiro setor', 'social', 'inovação', 'inovacao',
  'tecnologia', 'meio ambiente', 'sustentabilidade', 'esporte',
  'patrimônio', 'patrimonio', 'museu', 'biblioteca', 'teatro', 'música', 'musica',
  'economia criativa', 'empreendedorismo', 'chamamento', 'credenciamento',
  'seleção pública', 'concurso', 'infracultura', 'descentralização',
]

export async function scrapeSudeste(): Promise<number> {
  const catRes = await pool.query("SELECT id FROM categorias WHERE slug = 'multidisciplinar'")
  const defaultCat = catRes.rows[0]?.id

  let total = 0

  const strategies: Array<{ nome: string; fn: () => Promise<number> }> = [
    { nome: 'Mapa Cultural BH (API)', fn: () => scrapeMapaCulturalBH(defaultCat) },
    { nome: 'Cultura RJ (RSS)', fn: () => scrapeRSS('https://cultura.rj.gov.br/feed/', 'Secretaria de Cultura e Economia Criativa do RJ', 'RJ', null, 'estadual', defaultCat) },
    { nome: 'FCS MG (RSS)', fn: () => scrapeRSS('https://fcs.mg.gov.br/feed/', 'Fundação Clóvis Salgado', 'MG', 'Belo Horizonte', 'estadual', defaultCat) },
    { nome: 'Cultura RJ (HTML)', fn: () => scrapeHTML('https://cultura.rj.gov.br/editais/', 'Secretaria de Cultura RJ', 'RJ', null, 'estadual', defaultCat) },
    { nome: 'FCS MG (HTML)', fn: () => scrapeHTML('https://fcs.mg.gov.br/editais', 'Fundação Clóvis Salgado', 'MG', 'Belo Horizonte', 'estadual', defaultCat) },
    { nome: 'FAPEMIG (HTML)', fn: () => scrapeHTML('https://fapemig.br/pt/editais/', 'FAPEMIG', 'MG', null, 'estadual', defaultCat) },
    { nome: 'SP Cultura (HTML)', fn: () => scrapeHTML('https://www.cultura.sp.gov.br/editais', 'Secretaria de Cultura SP / PROAC', 'SP', null, 'estadual', defaultCat) },
    { nome: 'Prefeitura SP (HTML)', fn: () => scrapeHTML('https://www.prefeitura.sp.gov.br/cidade/secretarias/cultura/noticias/', 'Secretaria Municipal de Cultura SP', 'SP', 'São Paulo', 'municipal', defaultCat) },
  ]

  for (const s of strategies) {
    try {
      const novos = await s.fn()
      if (novos > 0) console.log(`    → ${s.nome}: ${novos} novos`)
      total += novos
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`    ⚠ ${s.nome}: ${msg.slice(0, 80)}`)
    }
  }

  return total
}

// === STRATEGY 1: Mapa Cultural BH API (Mapas Culturais platform) ===
async function scrapeMapaCulturalBH(defaultCat: number): Promise<number> {
  const fonteId = await getOrCreateFonte('Mapa Cultural BH', 'https://mapaculturalbh.pbh.gov.br')

  const url = 'https://mapaculturalbh.pbh.gov.br/api/opportunity/find?' +
    '@select=id,name,registrationFrom,registrationTo,shortDescription,owner.name&' +
    'status=GT(0)&@order=createTimestamp%20DESC&@limit=50'

  const response = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://mapaculturalbh.pbh.gov.br/oportunidades' },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) return 0

  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('json')) return 0

  const data = await response.json() as Array<{
    id: number; name: string; registrationFrom?: { date: string }
    registrationTo?: { date: string }; shortDescription?: string; owner?: { name: string }
  }>

  if (!Array.isArray(data)) return 0

  let novos = 0
  for (const opp of data) {
    if (!opp.name || opp.name.length < 10) continue

    const hash = `mapabh-${opp.id}`
    const link = `https://mapaculturalbh.pbh.gov.br/oportunidade/${opp.id}`
    const encerramento = opp.registrationTo?.date ? opp.registrationTo.date.split(' ')[0] : null
    const abertura = opp.registrationFrom?.date ? opp.registrationFrom.date.split(' ')[0] : null
    const orgao = opp.owner?.name || 'Fundação Municipal de Cultura de BH'
    const desc = opp.shortDescription || ''

    const inserted = await insertEdital(
      fonteId, opp.name, orgao, desc, defaultCat,
      link, hash, 'MG', 'Belo Horizonte', 'municipal',
      encerramento, abertura
    )
    if (inserted) novos++
  }

  if (novos > 0) {
    await pool.query("UPDATE fontes SET ultima_coleta = NOW() WHERE id = $1", [fonteId])
  }
  return novos
}

// === STRATEGY 2: RSS Feed scraping ===
async function scrapeRSS(
  feedUrl: string, orgao: string, uf: string,
  municipio: string | null, abrangencia: string, defaultCat: number
): Promise<number> {
  const domain = new URL(feedUrl).hostname.replace('www.', '')
  const fonteId = await getOrCreateFonte(orgao, feedUrl)

  const response = await fetch(feedUrl, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) return 0

  const xml = await response.text()
  if (!xml.includes('<rss') && !xml.includes('<feed') && !xml.includes('<channel')) return 0

  const $ = cheerio.load(xml, { xmlMode: true })

  let novos = 0
  const items = $('item').length ? $('item') : $('entry')

  items.each((_i, el) => {
    const $el = $(el)
    const titulo = ($el.find('title').text() || '').trim()
    const link = ($el.find('link').text() || $el.find('link').attr('href') || '').trim()
    const desc = ($el.find('description').text() || $el.find('content').text() || '').trim()
    const pubDate = ($el.find('pubDate').text() || $el.find('published').text() || '').trim()

    if (!titulo || titulo.length < 10) return
    if (!isRelevant(titulo + ' ' + desc)) return

    const hash = `rss-${domain}-${titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 55)}`
    const cleanDesc = cheerio.load(desc)('body').text().trim()

    insertEdital(
      fonteId, titulo, orgao, cleanDesc, defaultCat,
      link, hash, uf, municipio, abrangencia, null, null
    ).then(inserted => { if (inserted) novos++ }).catch(() => {})
  })

  await new Promise(resolve => setTimeout(resolve, 800))

  if (novos > 0) {
    await pool.query("UPDATE fontes SET ultima_coleta = NOW() WHERE id = $1", [fonteId])
  }
  return novos
}

// === STRATEGY 3: HTML scraping (for sites that return server-rendered content) ===
async function scrapeHTML(
  url: string, orgao: string, uf: string,
  municipio: string | null, abrangencia: string, defaultCat: number
): Promise<number> {
  const fonteId = await getOrCreateFonte(orgao, url)

  const response = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  })
  if (!response.ok) return 0

  const html = await response.text()
  if (html.includes('Acesso Bloqueado') || html.includes('Just a moment')) return 0

  const $ = cheerio.load(html)

  let novos = 0

  $('a').each((_i, el) => {
    const $el = $(el)
    const titulo = $el.text().trim()
    const href = $el.attr('href') || ''

    if (!titulo || titulo.length < 20 || titulo.length > 300) return
    if (!isRelevant(titulo)) return

    const fullLink = resolveLink(href, url)
    const domain = new URL(url).hostname.replace('www.', '')
    const hash = `html-${domain}-${titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 55)}`

    insertEdital(
      fonteId, titulo, orgao, '', defaultCat,
      fullLink, hash, uf, municipio, abrangencia, null, null
    ).then(inserted => { if (inserted) novos++ }).catch(() => {})
  })

  await new Promise(resolve => setTimeout(resolve, 800))

  if (novos > 0) {
    await pool.query("UPDATE fontes SET ultima_coleta = NOW() WHERE id = $1", [fonteId])
  }
  return novos
}

// === Shared helpers ===

async function getOrCreateFonte(nome: string, urlBase: string): Promise<number> {
  const slug = nome.toLowerCase().split(/[\s—-]/)[0]
  const res = await pool.query("SELECT id FROM fontes WHERE LOWER(nome) LIKE $1 LIMIT 1", [`%${slug}%`])
  if (res.rows.length) return res.rows[0].id

  const ins = await pool.query(
    "INSERT INTO fontes (nome, url_base, tipo) VALUES ($1, $2, 'scraping') RETURNING id",
    [nome, urlBase]
  )
  return ins.rows[0].id
}

async function insertEdital(
  fonteId: number, titulo: string, orgao: string, descricao: string,
  catId: number, link: string, hash: string,
  uf: string | null, municipio: string | null, abrangencia: string,
  encerramento: string | null, abertura: string | null
): Promise<boolean> {
  const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
  if (existe.rows.length) return false

  await pool.query(`
    INSERT INTO editais (
      fonte_id, titulo, orgao, descricao, categoria_id,
      abrangencia, uf, municipio, link_edital, status, hash_unico,
      data_coleta, data_encerramento, data_abertura, fonte_encontrada
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Aberto', $10, CURRENT_DATE, $11, $12, $9)
  `, [fonteId, titulo.slice(0, 500), orgao, descricao.slice(0, 2000), catId,
      abrangencia, uf, municipio, link, hash, encerramento, abertura])
  return true
}

function resolveLink(link: string, baseUrl: string): string {
  if (!link) return baseUrl
  if (link.startsWith('http')) return link
  if (link.startsWith('/')) return new URL(baseUrl).origin + link
  return baseUrl.replace(/\/[^/]*$/, '/') + link
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return KEYWORDS.some(k => lower.includes(k))
}

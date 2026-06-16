import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const SOURCES = [
  // === BELO HORIZONTE / MG ===
  {
    nome: 'Prefeitura de BH — Cultura',
    urls: [
      'https://prefeitura.pbh.gov.br/cultura/editais',
      'https://prefeitura.pbh.gov.br/cultura/noticias',
      'https://prefeitura.pbh.gov.br/fundacao-municipal-de-cultura/editais',
    ],
    orgao: 'Prefeitura de Belo Horizonte / FMC',
    uf: 'MG',
    municipio: 'Belo Horizonte',
    abrangencia: 'municipal',
  },
  {
    nome: 'Mapa Cultural BH',
    urls: [
      'https://mapaculturalbh.pbh.gov.br/oportunidades',
      'https://mapaculturalbh.pbh.gov.br/editais',
    ],
    orgao: 'Fundação Municipal de Cultura de BH',
    uf: 'MG',
    municipio: 'Belo Horizonte',
    abrangencia: 'municipal',
  },
  {
    nome: 'Secretaria de Cultura MG',
    urls: [
      'https://www.cultura.mg.gov.br/editais',
      'https://www.cultura.mg.gov.br/noticias',
      'https://www.secult.mg.gov.br/editais',
      'https://www.secult.mg.gov.br/noticias',
    ],
    orgao: 'Secretaria de Estado de Cultura e Turismo de MG',
    uf: 'MG',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'Decentra MG',
    urls: [
      'https://www.cultura.mg.gov.br/decentra',
      'https://www.secult.mg.gov.br/decentra',
      'https://www.cultura.mg.gov.br/editais',
    ],
    orgao: 'Decentra — Descentralização de Recursos / SECULT MG',
    uf: 'MG',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'LEIC MG — Lei Estadual de Incentivo à Cultura',
    urls: [
      'https://www.cultura.mg.gov.br/leic',
      'https://www.secult.mg.gov.br/lei-estadual-de-incentivo-a-cultura',
      'https://www.cultura.mg.gov.br/incentivo-a-cultura',
    ],
    orgao: 'LEIC — Secretaria de Cultura MG',
    uf: 'MG',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'FCS — Fundação Clóvis Salgado',
    urls: [
      'https://fcs.mg.gov.br/editais',
      'https://fcs.mg.gov.br/noticias',
    ],
    orgao: 'Fundação Clóvis Salgado',
    uf: 'MG',
    municipio: 'Belo Horizonte',
    abrangencia: 'estadual',
  },

  // === SÃO PAULO ===
  {
    nome: 'PROAC SP — Programa de Ação Cultural',
    urls: [
      'https://www.cultura.sp.gov.br/proac',
      'https://www.cultura.sp.gov.br/editais',
      'https://proac.sp.gov.br/',
    ],
    orgao: 'PROAC — Secretaria de Cultura e Economia Criativa SP',
    uf: 'SP',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'Secretaria de Cultura SP',
    urls: [
      'https://www.cultura.sp.gov.br/editais',
      'https://www.cultura.sp.gov.br/noticias',
      'https://www.cultura.sp.gov.br/acoes-e-projetos',
    ],
    orgao: 'Secretaria de Cultura e Economia Criativa de SP',
    uf: 'SP',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'Prefeitura de SP — Cultura',
    urls: [
      'https://www.prefeitura.sp.gov.br/cidade/secretarias/cultura/noticias/',
      'https://www.prefeitura.sp.gov.br/cidade/secretarias/cultura/editais/',
    ],
    orgao: 'Secretaria Municipal de Cultura de SP',
    uf: 'SP',
    municipio: 'São Paulo',
    abrangencia: 'municipal',
  },

  // === RIO DE JANEIRO ===
  {
    nome: 'Secretaria de Cultura RJ',
    urls: [
      'https://cultura.rj.gov.br/editais/',
      'https://cultura.rj.gov.br/noticias/',
    ],
    orgao: 'Secretaria de Estado de Cultura e Economia Criativa do RJ',
    uf: 'RJ',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'FUNARJ',
    urls: [
      'https://www.funarj.rj.gov.br/editais',
      'https://www.funarj.rj.gov.br/noticias',
    ],
    orgao: 'Fundação Anita Mantuano de Artes do Estado do RJ (FUNARJ)',
    uf: 'RJ',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'Prefeitura do Rio — Cultura',
    urls: [
      'https://www.rio.rj.gov.br/web/smc/editais',
      'https://www.rio.rj.gov.br/web/smc/noticias',
    ],
    orgao: 'Secretaria Municipal de Cultura do Rio de Janeiro',
    uf: 'RJ',
    municipio: 'Rio de Janeiro',
    abrangencia: 'municipal',
  },

  // === ESPÍRITO SANTO ===
  {
    nome: 'SECULT ES',
    urls: [
      'https://secult.es.gov.br/editais',
      'https://secult.es.gov.br/noticias',
    ],
    orgao: 'Secretaria de Estado da Cultura do ES',
    uf: 'ES',
    municipio: null,
    abrangencia: 'estadual',
  },

  // === MG — Outras fontes ===
  {
    nome: 'FAPEMIG',
    urls: [
      'https://fapemig.br/pt/editais/',
      'https://fapemig.br/pt/noticias/',
    ],
    orgao: 'FAPEMIG — Fundação de Amparo à Pesquisa de MG',
    uf: 'MG',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'SEBRAE MG',
    urls: [
      'https://www.sebrae.com.br/sites/PortalSebrae/ufs/mg/editais',
    ],
    orgao: 'SEBRAE Minas Gerais',
    uf: 'MG',
    municipio: null,
    abrangencia: 'estadual',
  },

  // === SP — Outras fontes ===
  {
    nome: 'FAPESP',
    urls: [
      'https://fapesp.br/chamadas/',
    ],
    orgao: 'FAPESP — Fundação de Amparo à Pesquisa de SP',
    uf: 'SP',
    municipio: null,
    abrangencia: 'estadual',
  },
  {
    nome: 'SESC SP',
    urls: [
      'https://www.sescsp.org.br/editais/',
    ],
    orgao: 'SESC São Paulo',
    uf: 'SP',
    municipio: null,
    abrangencia: 'estadual',
  },
]

const KEYWORDS = [
  'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição', 'inscricao',
  'prêmio', 'premio', 'bolsa', 'patrocínio', 'patrocinio', 'apoio',
  'cultura', 'cultural', 'artístico', 'artistico', 'audiovisual',
  'proac', 'leic', 'decentra', 'pnab', 'lei rouanet', 'lei paulo gustavo',
  'incentivo', 'fomento', 'terceiro setor', 'social', 'inovação', 'inovacao',
  'tecnologia', 'meio ambiente', 'sustentabilidade', 'esporte',
  'patrimônio', 'patrimonio', 'museu', 'biblioteca', 'teatro', 'música', 'musica',
  'economia criativa', 'empreendedorismo', 'cooperativa',
]

export async function scrapeSudeste(): Promise<number> {
  const catRes = await pool.query("SELECT id FROM categorias WHERE slug = 'multidisciplinar'")
  const defaultCat = catRes.rows[0]?.id

  let totalNovos = 0

  for (const source of SOURCES) {
    try {
      const novos = await scrapeSource(source, defaultCat)
      if (novos > 0) {
        console.log(`    → ${source.nome}: ${novos} novos`)
      }
      totalNovos += novos
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`    ⚠ ${source.nome}: ${msg}`)
    }
  }

  return totalNovos
}

async function scrapeSource(
  source: typeof SOURCES[0],
  defaultCat: number
): Promise<number> {
  const fonteNomePart = source.nome.split(' ')[0].toLowerCase()
  const fonteRes = await pool.query(
    "SELECT id FROM fontes WHERE LOWER(nome) LIKE $1 LIMIT 1",
    [`%${fonteNomePart}%`]
  )
  let fonteId: number
  if (fonteRes.rows.length) {
    fonteId = fonteRes.rows[0].id
  } else {
    const ins = await pool.query(
      "INSERT INTO fontes (nome, url_base, tipo) VALUES ($1, $2, 'scraping') RETURNING id",
      [source.nome, source.urls[0]]
    )
    fonteId = ins.rows[0].id
  }

  let novos = 0

  for (const url of source.urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      })
      if (!response.ok) continue
      const html = await response.text()
      const $ = cheerio.load(html)

      const selectors = [
        'article', '.tileItem', '.listagem-item', '.noticias-item',
        '.item', 'li.item-lista', '.card', '.edital-item',
        '.noticia-item', '.resultado-item', '.post', '.entry',
        'tr', '.row-item',
      ].join(', ')

      $(selectors).each((_i, el) => {
        const $el = $(el)
        const titulo = extractTitle($el, $)
        const linkEl = $el.find('a').first().attr('href') || ''
        const desc = $el.find('.tileBody, .descricao, .description, .resumo, p, td:nth-child(2)').first().text().trim()

        if (titulo && titulo.length > 15 && isRelevant(titulo + ' ' + desc)) {
          const fullLink = resolveLink(linkEl, url)
          const hash = `sudeste-${source.uf || 'br'}-${titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 55)}`

          insertEdital(
            fonteId, titulo, source.orgao, desc, defaultCat,
            fullLink, hash, source.uf, source.municipio, source.abrangencia
          ).then(inserted => { if (inserted) novos++ }).catch(() => {})
        }
      })
    } catch {
      // URL falhou, continua
    }
  }

  await new Promise(resolve => setTimeout(resolve, 500))

  if (novos > 0) {
    await pool.query("UPDATE fontes SET ultima_coleta = NOW() WHERE id = $1", [fonteId])
  }

  return novos
}

function extractTitle($el: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  const candidates = [
    $el.find('h1, h2, h3, h4').first().text().trim(),
    $el.find('.tileHeadline, .titulo, .title, .nome').first().text().trim(),
    $el.find('a').first().text().trim(),
    $el.find('td:first-child').first().text().trim(),
  ]
  return candidates.find(t => t && t.length > 10) || ''
}

function resolveLink(link: string, baseUrl: string): string {
  if (!link) return baseUrl
  if (link.startsWith('http')) return link
  if (link.startsWith('/')) {
    const origin = new URL(baseUrl).origin
    return `${origin}${link}`
  }
  return `${baseUrl.replace(/\/[^/]*$/, '/')}${link}`
}

async function insertEdital(
  fonteId: number, titulo: string, orgao: string, descricao: string,
  catId: number, link: string, hash: string,
  uf: string | null, municipio: string | null, abrangencia: string
): Promise<boolean> {
  const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
  if (existe.rows.length) return false

  await pool.query(`
    INSERT INTO editais (
      fonte_id, titulo, orgao, descricao, categoria_id,
      abrangencia, uf, municipio, link_edital, status, hash_unico,
      data_coleta, fonte_encontrada
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Aberto', $10, CURRENT_DATE, $9)
  `, [fonteId, titulo.slice(0, 500), orgao, descricao.slice(0, 2000), catId,
      abrangencia, uf, municipio, link, hash])
  return true
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return KEYWORDS.some(k => lower.includes(k))
}

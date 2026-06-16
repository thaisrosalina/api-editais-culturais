import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const SOURCES = [
  {
    nome: 'Ministério da Cultura',
    urls: [
      'https://www.gov.br/cultura/pt-br/assuntos/editais',
      'https://www.gov.br/cultura/pt-br/assuntos/noticias',
    ],
    orgao: 'Ministério da Cultura',
    area: 'cultura',
  },
  {
    nome: 'Ministério do Esporte',
    urls: [
      'https://www.gov.br/esporte/pt-br/acoes-e-programas',
      'https://www.gov.br/esporte/pt-br/noticias',
    ],
    orgao: 'Ministério do Esporte',
    area: 'esporte',
  },
  {
    nome: 'Ministério do Meio Ambiente',
    urls: [
      'https://www.gov.br/mma/pt-br/assuntos/noticias',
      'https://www.gov.br/mma/pt-br/acesso-a-informacao/editais',
    ],
    orgao: 'Ministério do Meio Ambiente',
    area: 'meio-ambiente',
  },
  {
    nome: 'MCTI — Ciência e Tecnologia',
    urls: [
      'https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/noticias',
      'https://www.gov.br/mcti/pt-br/acesso-rapido/editais',
    ],
    orgao: 'Ministério da Ciência, Tecnologia e Inovação',
    area: 'inovacao',
  },
  {
    nome: 'Secretaria-Geral — Terceiro Setor',
    urls: [
      'https://www.gov.br/secretariageral/pt-br/noticias',
      'https://www.gov.br/participamaisbrasil/editais-abertos',
    ],
    orgao: 'Secretaria-Geral da Presidência',
    area: 'terceiro-setor',
  },
  {
    nome: 'FUNARTE',
    urls: [
      'https://www.gov.br/funarte/pt-br/editais',
    ],
    orgao: 'Funarte / Ministério da Cultura',
    area: 'cultura',
  },
  {
    nome: 'FINEP — Inovação',
    urls: [
      'http://www.finep.gov.br/chamadas-publicas',
      'http://www.finep.gov.br/noticias',
    ],
    orgao: 'FINEP — Financiadora de Estudos e Projetos',
    area: 'inovacao',
  },
  {
    nome: 'CNPq',
    urls: [
      'https://www.gov.br/cnpq/pt-br/acesso-a-informacao/chamadas-publicas',
    ],
    orgao: 'CNPq — Conselho Nacional de Desenvolvimento Científico e Tecnológico',
    area: 'inovacao',
  },
  {
    nome: 'Fundo Nacional do Meio Ambiente',
    urls: [
      'https://www.gov.br/mma/pt-br/assuntos/fundo-nacional-do-meio-ambiente',
    ],
    orgao: 'Fundo Nacional do Meio Ambiente (FNMA)',
    area: 'meio-ambiente',
  },
  {
    nome: 'Lei de Incentivo ao Esporte',
    urls: [
      'https://www.gov.br/esporte/pt-br/acoes-e-programas/lei-de-incentivo-ao-esporte',
    ],
    orgao: 'Ministério do Esporte — Lei de Incentivo',
    area: 'esporte',
  },
]

const KEYWORDS: Record<string, string[]> = {
  'cultura': [
    'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição', 'inscricao',
    'prêmio', 'premio', 'bolsa', 'patrocínio', 'patrocinio', 'apoio a projetos',
    'cultura', 'cultural', 'artístico', 'artistico', 'pnab', 'lei rouanet',
    'lei paulo gustavo', 'audiovisual', 'patrimônio', 'patrimonio',
  ],
  'terceiro-setor': [
    'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição',
    'ong', 'osc', 'terceiro setor', 'organização social', 'organizacao social',
    'mrosc', 'marco regulatório', 'parceria', 'termo de fomento',
    'termo de colaboração', 'chamamento público', 'chamamento publico',
    'impacto social', 'desenvolvimento comunitário', 'comunidade',
  ],
  'inovacao': [
    'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição',
    'inovação', 'inovacao', 'tecnologia', 'startup', 'pesquisa',
    'desenvolvimento', 'p&d', 'ciência', 'ciencia', 'empreendedorismo',
    'aceleradora', 'incubadora', 'finep', 'cnpq', 'embrapii',
    'economia criativa', 'transformação digital', 'inteligência artificial',
  ],
  'meio-ambiente': [
    'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição',
    'meio ambiente', 'ambiental', 'sustentabilidade', 'sustentável',
    'biodiversidade', 'conservação', 'conservacao', 'clima', 'floresta',
    'reciclagem', 'energia renovável', 'energia renovavel', 'carbono',
    'restauração', 'restauracao', 'saneamento', 'resíduos',
  ],
  'esporte': [
    'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição',
    'esporte', 'esportivo', 'atleta', 'olimpíada', 'olimpiada',
    'paradesporto', 'lei de incentivo ao esporte', 'bolsa atleta',
    'programa esporte', 'lazer', 'atividade física',
  ],
}

export async function scrapeGovBr(): Promise<number> {
  const catRes = await pool.query("SELECT id, slug FROM categorias")
  const categorias: Record<string, number> = {}
  catRes.rows.forEach((r: { id: number; slug: string }) => { categorias[r.slug] = r.id })
  const defaultCat = categorias['multidisciplinar']

  let totalNovos = 0

  for (const source of SOURCES) {
    try {
      const novos = await scrapeSource(source, categorias, defaultCat)
      totalNovos += novos
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ⚠ ${source.nome}: ${msg}`)
    }
  }

  return totalNovos
}

async function scrapeSource(
  source: typeof SOURCES[0],
  categorias: Record<string, number>,
  defaultCat: number
): Promise<number> {
  const fonteRes = await pool.query(
    "SELECT id FROM fontes WHERE LOWER(nome) LIKE $1 LIMIT 1",
    [`%${source.nome.toLowerCase().split(' ')[0]}%`]
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

  const coletaRes = await pool.query(
    "INSERT INTO coletas_log (fonte_id) VALUES ($1) RETURNING id",
    [fonteId]
  )
  const coletaId = coletaRes.rows[0].id

  let totalEncontrados = 0
  let novos = 0

  try {
    const keywords = KEYWORDS[source.area] || KEYWORDS['cultura']
    const catId = mapAreaToCategory(source.area, categorias) || defaultCat

    for (const url of source.urls) {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EditalBot/1.0)' },
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok) continue
        const html = await response.text()
        const $ = cheerio.load(html)

        $('article, .tileItem, .listagem-item, .noticias-item, .item, li.item-lista').each((_i, el) => {
          const $el = $(el)
          const titulo = $el.find('h2, h3, h4, .tileHeadline, .titulo').first().text().trim()
            || $el.find('a').first().text().trim()
          const linkEl = $el.find('a').first().attr('href') || ''
          const desc = $el.find('.tileBody, .descricao, .description, p').first().text().trim()

          if (titulo && titulo.length > 15 && isRelevant(titulo + ' ' + desc, keywords)) {
            totalEncontrados++
            const fullLink = linkEl.startsWith('http') ? linkEl : `https://www.gov.br${linkEl}`
            const hash = `govbr-${titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60)}`

            insertEdital(fonteId, titulo, source.orgao, desc, catId, fullLink, hash).then(inserted => {
              if (inserted) novos++
            }).catch(() => {})
          }
        })
      } catch {
        // URL individual falhou, continua com as outras
      }
    }

    // Esperar inserts
    await new Promise(resolve => setTimeout(resolve, 1000))

    await pool.query(
      "UPDATE coletas_log SET fim = NOW(), editais_encontrados = $1, editais_novos = $2, status = 'sucesso' WHERE id = $3",
      [totalEncontrados, novos, coletaId]
    )
    await pool.query("UPDATE fontes SET ultima_coleta = NOW() WHERE id = $1", [fonteId])
    return novos
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await pool.query(
      "UPDATE coletas_log SET fim = NOW(), erro = $1, status = 'erro' WHERE id = $2",
      [msg, coletaId]
    )
    return 0
  }
}

async function insertEdital(
  fonteId: number, titulo: string, orgao: string,
  descricao: string, catId: number, link: string, hash: string
): Promise<boolean> {
  const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
  if (existe.rows.length) return false

  const ano = new Date().getFullYear()
  const countRes = await pool.query("SELECT COUNT(*) FROM editais WHERE id_edital LIKE $1", [`BR-${ano}-%`])
  const seq = (parseInt(countRes.rows[0].count, 10) + 1).toString().padStart(3, '0')
  const idEdital = `BR-${ano}-${seq}`

  await pool.query(`
    INSERT INTO editais (
      fonte_id, titulo, orgao, descricao, categoria_id,
      abrangencia, link_edital, status, hash_unico, data_coleta,
      fonte_encontrada, id_edital
    ) VALUES ($1, $2, $3, $4, $5, 'nacional', $6, 'Aberto', $7, CURRENT_DATE, $6, $8)
  `, [fonteId, titulo.slice(0, 500), orgao, descricao.slice(0, 2000), catId, link, hash, idEdital])
  return true
}

function mapAreaToCategory(area: string, categorias: Record<string, number>): number | null {
  const map: Record<string, string[]> = {
    'cultura': ['multidisciplinar', 'cultura-popular', 'audiovisual'],
    'terceiro-setor': ['diversidade', 'multidisciplinar'],
    'inovacao': ['economia-criativa', 'multidisciplinar'],
    'meio-ambiente': ['multidisciplinar'],
    'esporte': ['multidisciplinar'],
  }
  const slugs = map[area] || ['multidisciplinar']
  for (const slug of slugs) {
    if (categorias[slug]) return categorias[slug]
  }
  return null
}

function isRelevant(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

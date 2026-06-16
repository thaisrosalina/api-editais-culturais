import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const URLS = [
  'https://www.gov.br/cultura/pt-br/assuntos/editais',
  'https://www.gov.br/cultura/pt-br/assuntos/noticias',
]

export async function scrapeGovBrCultura(): Promise<number> {
  const fonteRes = await pool.query(
    "SELECT id FROM fontes WHERE LOWER(nome) LIKE '%minc%' OR LOWER(nome) LIKE '%gov.br%' LIMIT 1"
  )
  let fonteId: number
  if (fonteRes.rows.length) {
    fonteId = fonteRes.rows[0].id
  } else {
    const ins = await pool.query(
      "INSERT INTO fontes (nome, url_base, tipo) VALUES ('Gov.br / MinC', 'https://www.gov.br/cultura', 'scraping') RETURNING id"
    )
    fonteId = ins.rows[0].id
  }

  const coletaRes = await pool.query(
    "INSERT INTO coletas_log (fonte_id) VALUES ($1) RETURNING id",
    [fonteId]
  )
  const coletaId = coletaRes.rows[0].id

  try {
    const catRes = await pool.query("SELECT id FROM categorias WHERE slug = 'multidisciplinar'")
    const catId = catRes.rows[0]?.id

    let totalEncontrados = 0
    let novos = 0

    for (const url of URLS) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EditalBot/1.0)' },
      })
      const html = await response.text()
      const $ = cheerio.load(html)

      const links: { titulo: string; link: string; descricao: string }[] = []

      $('article, .tileItem, .listagem-item, .noticias-item').each((_i, el) => {
        const $el = $(el)
        const titulo = $el.find('h2, h3, .tileHeadline, .titulo').first().text().trim()
        const linkEl = $el.find('a').first().attr('href') || ''
        const desc = $el.find('.tileBody, .descricao, .description, p').first().text().trim()

        if (titulo && titulo.length > 15 && isEditalRelated(titulo + ' ' + desc)) {
          links.push({
            titulo: titulo.slice(0, 500),
            link: linkEl.startsWith('http') ? linkEl : `https://www.gov.br${linkEl}`,
            descricao: desc.slice(0, 2000),
          })
        }
      })

      totalEncontrados += links.length

      for (const edital of links) {
        const hash = `govbr-${edital.titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60)}`
        const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
        if (existe.rows.length) continue

        await pool.query(`
          INSERT INTO editais (
            fonte_id, titulo, orgao, descricao, categoria_id,
            abrangencia, link_edital, status, hash_unico, data_coleta
          ) VALUES ($1, $2, 'Ministério da Cultura', $3, $4, 'nacional', $5, 'Aberto', $6, CURRENT_DATE)
        `, [fonteId, edital.titulo, edital.descricao, catId, edital.link, hash])
        novos++
      }
    }

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
    throw err
  }
}

function isEditalRelated(text: string): boolean {
  const lower = text.toLowerCase()
  const keywords = [
    'edital', 'chamada', 'seleção', 'selecao', 'fomento', 'inscrição', 'inscricao',
    'prêmio', 'premio', 'bolsa', 'patrocínio', 'patrocinio', 'apoio a projetos',
    'cultura', 'cultural', 'artístico', 'artistico', 'pnab', 'lei rouanet',
    'lei paulo gustavo', 'audiovisual', 'patrimônio', 'patrimonio',
  ]
  return keywords.some(k => lower.includes(k))
}

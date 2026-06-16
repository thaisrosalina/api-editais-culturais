import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const BASE_URL = 'https://www.gov.br/funarte/pt-br/editais'

interface EditalExtraido {
  titulo: string
  link: string
  descricao: string
}

export async function scrapeFunarte(): Promise<number> {
  const fonteRes = await pool.query("SELECT id FROM fontes WHERE nome = 'Funarte'")
  if (!fonteRes.rows.length) return 0
  const fonteId = fonteRes.rows[0].id

  const coletaRes = await pool.query(
    "INSERT INTO coletas_log (fonte_id) VALUES ($1) RETURNING id",
    [fonteId]
  )
  const coletaId = coletaRes.rows[0].id

  try {
    const response = await fetch(BASE_URL)
    const html = await response.text()
    const $ = cheerio.load(html)

    const editaisExtraidos: EditalExtraido[] = []

    $('article.tileItem, .item-edital, .entry-content a, .tileContent').each((_i, el) => {
      const $el = $(el)
      const titulo = $el.find('h2, .tileHeadline, .headline').first().text().trim()
        || $el.text().trim()
      const link = $el.find('a').first().attr('href') || $el.attr('href') || ''
      const descricao = $el.find('.tileBody, .description, p').first().text().trim()

      if (titulo && titulo.length > 10) {
        editaisExtraidos.push({
          titulo: titulo.slice(0, 500),
          link: link.startsWith('http') ? link : `https://www.gov.br${link}`,
          descricao: descricao.slice(0, 2000),
        })
      }
    })

    let novos = 0
    const categoriaMulti = await pool.query("SELECT id FROM categorias WHERE slug = 'multidisciplinar'")
    const catId = categoriaMulti.rows[0]?.id

    for (const edital of editaisExtraidos) {
      const hash = `funarte-${edital.titulo.toLowerCase().replace(/\s+/g, '-').slice(0, 50)}`

      const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
      if (existe.rows.length) continue

      await pool.query(`
        INSERT INTO editais (fonte_id, titulo, orgao, descricao, categoria_id, abrangencia, link_edital, status, hash_unico)
        VALUES ($1, $2, 'Funarte / Ministério da Cultura', $3, $4, 'nacional', $5, 'aberto', $6)
      `, [fonteId, edital.titulo, edital.descricao, catId, edital.link, hash])
      novos++
    }

    await pool.query(
      "UPDATE coletas_log SET fim = NOW(), editais_encontrados = $1, editais_novos = $2, status = 'sucesso' WHERE id = $3",
      [editaisExtraidos.length, novos, coletaId]
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

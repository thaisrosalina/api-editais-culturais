import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const BASE_URL = 'https://prosas.com.br/editais?query=cultura&status=open'

export async function scrapeProsa(): Promise<number> {
  const fonteRes = await pool.query(
    "SELECT id FROM fontes WHERE LOWER(nome) LIKE '%prosas%' LIMIT 1"
  )
  let fonteId: number
  if (fonteRes.rows.length) {
    fonteId = fonteRes.rows[0].id
  } else {
    const ins = await pool.query(
      "INSERT INTO fontes (nome, url_base, tipo) VALUES ('Prosas', 'https://prosas.com.br', 'scraping') RETURNING id"
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

    const response = await fetch(BASE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EditalBot/1.0)' },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    const editais: { titulo: string; link: string; orgao: string; descricao: string; deadline: string }[] = []

    $('.edital-card, .opportunity-card, .card, article').each((_i, el) => {
      const $el = $(el)
      const titulo = $el.find('h2, h3, .card-title, .edital-title, .opportunity-title').first().text().trim()
      const linkEl = $el.find('a').first().attr('href') || ''
      const orgao = $el.find('.organization, .org-name, .card-subtitle, .instituicao').first().text().trim()
      const desc = $el.find('.description, .card-text, p').first().text().trim()
      const deadline = $el.find('.deadline, .prazo, time, .date').first().text().trim()

      if (titulo && titulo.length > 10) {
        editais.push({
          titulo: titulo.slice(0, 500),
          link: linkEl.startsWith('http') ? linkEl : `https://prosas.com.br${linkEl}`,
          orgao: orgao.slice(0, 300) || 'Via Prosas',
          descricao: desc.slice(0, 2000),
          deadline,
        })
      }
    })

    let novos = 0
    for (const edital of editais) {
      const hash = `prosas-${edital.titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60)}`
      const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
      if (existe.rows.length) continue

      const encerramento = parseDate(edital.deadline)

      await pool.query(`
        INSERT INTO editais (
          fonte_id, titulo, orgao, descricao, categoria_id,
          abrangencia, link_edital, link_inscricao, status, hash_unico,
          data_coleta, data_encerramento, pode_pj
        ) VALUES ($1, $2, $3, $4, $5, 'nacional', $6, $6, 'Aberto', $7, CURRENT_DATE, $8, true)
      `, [fonteId, edital.titulo, edital.orgao, edital.descricao, catId, edital.link, hash, encerramento])
      novos++
    }

    await pool.query(
      "UPDATE coletas_log SET fim = NOW(), editais_encontrados = $1, editais_novos = $2, status = 'sucesso' WHERE id = $3",
      [editais.length, novos, coletaId]
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

function parseDate(text: string): string | null {
  if (!text) return null
  const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (match) {
    const [, d, m, y] = match
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return isoMatch[0]
  return null
}

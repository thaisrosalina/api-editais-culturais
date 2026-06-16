import * as cheerio from 'cheerio'
import pool from '../db/pool.js'

const SEARCHES = [
  { query: 'cultura', area: 'Cultura' },
  { query: 'arte', area: 'Cultura' },
  { query: 'patrimonio', area: 'Cultura' },
  { query: 'social', area: 'Terceiro Setor' },
  { query: 'comunidade', area: 'Terceiro Setor' },
  { query: 'ong', area: 'Terceiro Setor' },
  { query: 'inovacao', area: 'Inovação' },
  { query: 'tecnologia', area: 'Inovação' },
  { query: 'empreendedorismo', area: 'Inovação' },
  { query: 'meio ambiente', area: 'Meio Ambiente' },
  { query: 'sustentabilidade', area: 'Meio Ambiente' },
  { query: 'esporte', area: 'Esporte' },
  { query: 'juventude', area: 'Terceiro Setor' },
  { query: 'educacao', area: 'Terceiro Setor' },
  { query: 'diversidade', area: 'Terceiro Setor' },
]

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

    let totalEncontrados = 0
    let novos = 0
    const seen = new Set<string>()

    for (const search of SEARCHES) {
      try {
        const url = `https://prosas.com.br/editais?query=${encodeURIComponent(search.query)}&status=open`
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EditalBot/1.0)' },
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok) continue
        const html = await response.text()
        const $ = cheerio.load(html)

        $('.edital-card, .opportunity-card, .card, article, .resultado-item').each((_i, el) => {
          const $el = $(el)
          const titulo = $el.find('h2, h3, .card-title, .edital-title, .opportunity-title, a').first().text().trim()
          const linkEl = $el.find('a').first().attr('href') || ''
          const orgao = $el.find('.organization, .org-name, .card-subtitle, .instituicao').first().text().trim()
          const desc = $el.find('.description, .card-text, p').first().text().trim()
          const deadline = $el.find('.deadline, .prazo, time, .date').first().text().trim()

          if (titulo && titulo.length > 10) {
            const hash = `prosas-${titulo.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60)}`
            if (seen.has(hash)) return
            seen.add(hash)

            totalEncontrados++
            const fullLink = linkEl.startsWith('http') ? linkEl : `https://prosas.com.br${linkEl}`
            const encerramento = parseDate(deadline)

            insertEdital(
              fonteId, titulo, orgao || 'Via Prosas', desc, catId,
              fullLink, hash, encerramento, search.area
            ).then(inserted => { if (inserted) novos++ }).catch(() => {})
          }
        })
      } catch {
        // Busca individual falhou, continua
      }
    }

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
    throw err
  }
}

async function insertEdital(
  fonteId: number, titulo: string, orgao: string, descricao: string,
  catId: number, link: string, hash: string, encerramento: string | null, area: string
): Promise<boolean> {
  const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
  if (existe.rows.length) return false

  const status = (encerramento && new Date(encerramento) < new Date()) ? 'Encerrado' : 'Aberto'
  const ano = new Date().getFullYear()
  const countRes = await pool.query("SELECT COUNT(*) FROM editais WHERE id_edital LIKE $1", [`BR-${ano}-%`])
  const seq = (parseInt(countRes.rows[0].count, 10) + 1).toString().padStart(3, '0')
  const idEdital = `BR-${ano}-${seq}`

  await pool.query(`
    INSERT INTO editais (
      fonte_id, titulo, orgao, descricao, categoria_id,
      abrangencia, link_edital, link_inscricao, status, hash_unico,
      data_coleta, data_encerramento, pode_pj, fonte_encontrada,
      subsetores_obs, id_edital
    ) VALUES ($1, $2, $3, $4, $5, 'nacional', $6, $6, $7, $8, CURRENT_DATE, $9, true, 'https://prosas.com.br', $10, $11)
  `, [fonteId, titulo.slice(0, 500), orgao, descricao.slice(0, 2000), catId, link, status, hash, encerramento, `Área: ${area}`, idEdital])
  return true
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

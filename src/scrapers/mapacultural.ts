import pool from '../db/pool.js'

const API_BASE = 'https://mapas.cultura.gov.br/api'

interface MapaCulturalOportunidade {
  id: number
  name: string
  shortDescription?: string
  registrationFrom?: string
  registrationTo?: string
  owner?: { name?: string }
  terms?: { area?: string[] }
  singleUrl?: string
  status?: number
}

export async function scrapeMapaCultural(): Promise<number> {
  const fonteRes = await pool.query(
    "SELECT id FROM fontes WHERE LOWER(nome) LIKE '%mapa%cultural%' OR LOWER(nome) LIKE '%mapas%' LIMIT 1"
  )
  let fonteId: number
  if (fonteRes.rows.length) {
    fonteId = fonteRes.rows[0].id
  } else {
    const ins = await pool.query(
      "INSERT INTO fontes (nome, url_base, tipo) VALUES ('Mapa Cultural (Mapas Culturais)', 'https://mapas.cultura.gov.br', 'api') RETURNING id"
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

    const url = `${API_BASE}/opportunity/find?@select=id,name,shortDescription,registrationFrom,registrationTo,owner.name,terms,singleUrl,status&@order=createTimestamp DESC&@limit=50&status=GTE(0)`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EditalBot/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Mapa Cultural API retornou ${response.status}`)
    }

    const oportunidades: MapaCulturalOportunidade[] = await response.json() as MapaCulturalOportunidade[]

    let novos = 0
    const totalEncontrados = oportunidades.length

    for (const op of oportunidades) {
      if (!op.name || op.name.length < 10) continue

      const hash = `mapacultural-${op.id}`
      const existe = await pool.query('SELECT id FROM editais WHERE hash_unico = $1', [hash])
      if (existe.rows.length) continue

      const orgao = op.owner?.name || 'Via Mapa Cultural'
      const link = op.singleUrl || `https://mapas.cultura.gov.br/oportunidade/${op.id}`
      const setores = op.terms?.area || []
      const dataAbertura = op.registrationFrom ? op.registrationFrom.split('T')[0] : null
      const dataEncerramento = op.registrationTo ? op.registrationTo.split('T')[0] : null
      const status = (dataEncerramento && new Date(dataEncerramento) < new Date()) ? 'Encerrado' : 'Aberto'

      const ano = new Date().getFullYear()
      const countRes = await pool.query("SELECT COUNT(*) FROM editais WHERE id_edital LIKE $1", [`BR-${ano}-%`])
      const seq = (parseInt(countRes.rows[0].count, 10) + 1).toString().padStart(3, '0')
      const idEdital = `BR-${ano}-${seq}`

      await pool.query(`
        INSERT INTO editais (
          fonte_id, titulo, orgao, descricao, categoria_id,
          abrangencia, link_edital, link_inscricao, status, hash_unico,
          data_coleta, data_abertura, data_encerramento,
          setores, pode_pf, pode_pj, fonte_encontrada, id_edital
        ) VALUES (
          $1, $2, $3, $4, $5,
          'nacional', $6, $6, $7, $8,
          CURRENT_DATE, $9, $10,
          $11, true, true, 'https://mapas.cultura.gov.br', $12
        )
      `, [
        fonteId, op.name.slice(0, 500), orgao,
        (op.shortDescription || '').slice(0, 2000), catId,
        link, status, hash,
        dataAbertura, dataEncerramento,
        setores.length > 0 ? setores : null, idEdital,
      ])
      novos++
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

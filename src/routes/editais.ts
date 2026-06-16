import { Router, Request, Response } from 'express'
import pool from '../db/pool.js'

const router = Router()

/**
 * @swagger
 * /api/editais:
 *   get:
 *     summary: Lista editais com filtros
 *     tags: [Editais]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [aberto, encerrado, em_breve, suspenso, resultado] }
 *       - in: query
 *         name: uf
 *         schema: { type: string }
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Slug da categoria
 *       - in: query
 *         name: abrangencia
 *         schema: { type: string, enum: [municipal, estadual, regional, nacional, internacional] }
 *       - in: query
 *         name: modalidade
 *         schema: { type: string }
 *         description: "PNAB - Fomento, Lei de Incentivo, Patrocínio direto, Edital específico, Chamada pública, Premiação"
 *       - in: query
 *         name: prioridade
 *         schema: { type: string, enum: [Alta, Média, Baixa] }
 *       - in: query
 *         name: go_nogo
 *         schema: { type: string, enum: [Go, Avaliar, No-Go] }
 *       - in: query
 *         name: pode_pf
 *         schema: { type: boolean }
 *       - in: query
 *         name: pode_pj
 *         schema: { type: boolean }
 *       - in: query
 *         name: busca
 *         schema: { type: string }
 *         description: Busca por título, órgão ou descrição
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lista paginada de editais com dias_restantes calculado
 */
router.get('/', async (req: Request, res: Response) => {
  const {
    status, uf, categoria, abrangencia, modalidade,
    prioridade, go_nogo, pode_pf, pode_pj,
    busca, limite = '50', pagina = '1',
  } = req.query

  const lim = Math.min(Math.max(parseInt(limite as string, 10) || 50, 1), 200)
  const pag = Math.max(parseInt(pagina as string, 10) || 1, 1)
  const offset = (pag - 1) * lim
  const conditions: string[] = []
  const params: unknown[] = []
  let i = 1

  if (status) { conditions.push(`e.status = $${i++}`); params.push(status) }
  if (uf) { conditions.push(`e.uf = $${i++}`); params.push((uf as string).toUpperCase()) }
  if (categoria) { conditions.push(`c.slug = $${i++}`); params.push(categoria) }
  if (abrangencia) { conditions.push(`e.abrangencia = $${i++}`); params.push(abrangencia) }
  if (modalidade) { conditions.push(`e.modalidade = $${i++}`); params.push(modalidade) }
  if (prioridade) { conditions.push(`e.prioridade = $${i++}`); params.push(prioridade) }
  if (go_nogo) { conditions.push(`e.go_nogo = $${i++}`); params.push(go_nogo) }
  if (pode_pf === 'true') { conditions.push(`e.pode_pf = true`) }
  if (pode_pj === 'true') { conditions.push(`e.pode_pj = true`) }
  if (busca) {
    conditions.push(`(e.titulo ILIKE $${i} OR e.orgao ILIKE $${i} OR e.descricao ILIKE $${i} OR e.subsetores_obs ILIKE $${i})`)
    params.push(`%${busca}%`)
    i++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countQuery = `
    SELECT COUNT(*) FROM editais e
    LEFT JOIN categorias c ON c.id = e.categoria_id
    ${where}
  `
  const dataQuery = `
    SELECT e.*,
           c.nome AS categoria_nome, c.slug AS categoria_slug,
           f.nome AS fonte_nome,
           CASE
             WHEN e.data_encerramento IS NOT NULL
             THEN (e.data_encerramento - CURRENT_DATE)::int
             ELSE NULL
           END AS dias_restantes
    FROM editais e
    LEFT JOIN categorias c ON c.id = e.categoria_id
    LEFT JOIN fontes f ON f.id = e.fonte_id
    ${where}
    ORDER BY
      CASE e.status
        WHEN 'aberto' THEN 1
        WHEN 'em_breve' THEN 2
        WHEN 'encerrado' THEN 3
        ELSE 4
      END,
      e.data_encerramento ASC NULLS LAST,
      e.prioridade = 'Alta' DESC,
      e.criado_em DESC
    LIMIT $${i++} OFFSET $${i++}
  `
  params.push(lim, offset)

  const [countRes, dataRes] = await Promise.all([
    pool.query(countQuery, params.slice(0, params.length - 2)),
    pool.query(dataQuery, params),
  ])

  res.json({
    total: parseInt(countRes.rows[0].count, 10),
    pagina: pag,
    limite: lim,
    dados: dataRes.rows,
  })
})

/**
 * @swagger
 * /api/editais/export/csv:
 *   get:
 *     summary: Exporta editais em CSV (formato compatível com Google Sheets)
 *     tags: [Editais]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CSV para download/importação
 */
router.get('/export/csv', async (req: Request, res: Response) => {
  const conditions: string[] = []
  const params: unknown[] = []
  let i = 1

  if (req.query.status) { conditions.push(`e.status = $${i++}`); params.push(req.query.status) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(`
    SELECT e.id_edital AS "ID_Edital",
           e.titulo AS "Nome_Edital",
           e.orgao AS "Órgão",
           COALESCE(e.municipio || '/' || e.uf, e.uf, '') AS "Município/UF",
           e.abrangencia AS "Abrangência",
           e.modalidade AS "Modalidade",
           e.status AS "Status_Edital",
           TO_CHAR(e.data_publicacao, 'DD/MM/YYYY') AS "Data_Lançamento",
           TO_CHAR(e.data_abertura, 'DD/MM/YYYY') AS "Início_Inscrição",
           TO_CHAR(e.data_encerramento, 'DD/MM/YYYY') AS "Fim_Inscrição",
           (e.data_encerramento - CURRENT_DATE)::int AS "Dias_Restantes",
           CASE WHEN e.pode_pf THEN 'Sim' ELSE 'Não' END AS "Pode_PF",
           CASE WHEN e.pode_pj THEN 'Sim' ELSE 'Não' END AS "Pode_PJ",
           CASE WHEN e.exige_domicilio_local THEN 'Sim' ELSE 'Não' END AS "Exige_Domicílio_Local",
           e.qtd_projetos_por_proponente AS "Qtd_Projetos_por_Proponente",
           e.pontuacao_minima AS "Pontuação_Mínima",
           e.criterio_aprovacao AS "Critério_Aprovação",
           ARRAY_TO_STRING(e.setores, '; ') AS "Setores",
           e.subsetores_obs AS "Subsetores/Observações",
           e.perfil_alvo AS "Perfil_Alvo",
           CASE WHEN e.teto_por_projeto IS NOT NULL THEN 'R$ ' || TO_CHAR(e.teto_por_projeto, 'FM999G999G999D00') ELSE 'Não informado' END AS "Teto_por_Projeto",
           CASE WHEN e.renuncia_total_estimada IS NOT NULL THEN 'R$ ' || TO_CHAR(e.renuncia_total_estimada, 'FM999G999G999D00') ELSE 'Não informado' END AS "Renúncia_Total_Estimada",
           COALESCE(e.imposto_incentivado, 'Não aplicável') AS "Imposto_Incentivado",
           CASE WHEN e.contrapartida_obrigatoria THEN 'Sim' WHEN e.contrapartida_obrigatoria = false THEN 'Não' ELSE 'Não informado' END AS "Contrapartida_Obrigatória",
           CASE WHEN e.exige_acessibilidade THEN 'Sim' WHEN e.exige_acessibilidade = false THEN 'Não' ELSE 'Não informado' END AS "Exige_Acessibilidade",
           CASE WHEN e.exige_prestacao_contas THEN 'Sim' WHEN e.exige_prestacao_contas = false THEN 'Não' ELSE 'Não informado' END AS "Exige_Prestação_de_Contas",
           COALESCE(e.nivel_complexidade, 'Não informado') AS "Nível_de_Complexidade",
           e.link_edital AS "Link_Edital",
           COALESCE(e.link_dom, 'Não informado') AS "Link_DOM",
           COALESCE(e.link_inscricao, 'Não informado') AS "Link_Inscrição",
           COALESCE(e.fonte_encontrada, '') AS "Fonte_Encontrada",
           TO_CHAR(e.data_coleta, 'DD/MM/YYYY') AS "Data_da_Coleta",
           COALESCE(e.responsavel_interno, 'Não informado') AS "Responsável_Interno",
           COALESCE(e.prioridade, '') AS "Prioridade",
           COALESCE(e.go_nogo, '') AS "Go/No-Go",
           COALESCE(e.motivo_go_nogo, '') AS "Motivo_Go_No-Go",
           COALESCE(e.observacoes, '') AS "Observações"
    FROM editais e
    ${where}
    ORDER BY e.id_edital
  `, params)

  if (!rows.length) { res.status(404).json({ erro: 'Nenhum edital encontrado' }); return }

  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    ),
  ]

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename=editais_culturais.csv')
  res.send('﻿' + csvLines.join('\r\n'))
})

/**
 * @swagger
 * /api/editais/{id}:
 *   get:
 *     summary: Detalha um edital (por ID numérico ou id_edital como 2026-001)
 *     tags: [Editais]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Edital encontrado
 *       404:
 *         description: Edital não encontrado
 */
router.get('/:id', async (req: Request, res: Response) => {
  const isNumeric = /^\d+$/.test(req.params.id)
  const query = isNumeric
    ? `SELECT e.*, c.nome AS categoria_nome, c.slug AS categoria_slug,
              f.nome AS fonte_nome, f.url_base AS fonte_url,
              (e.data_encerramento - CURRENT_DATE)::int AS dias_restantes
       FROM editais e
       LEFT JOIN categorias c ON c.id = e.categoria_id
       LEFT JOIN fontes f ON f.id = e.fonte_id
       WHERE e.id = $1`
    : `SELECT e.*, c.nome AS categoria_nome, c.slug AS categoria_slug,
              f.nome AS fonte_nome, f.url_base AS fonte_url,
              (e.data_encerramento - CURRENT_DATE)::int AS dias_restantes
       FROM editais e
       LEFT JOIN categorias c ON c.id = e.categoria_id
       LEFT JOIN fontes f ON f.id = e.fonte_id
       WHERE e.id_edital = $1`

  const { rows } = await pool.query(query, [req.params.id])
  if (!rows.length) { res.status(404).json({ erro: 'Edital não encontrado' }); return }
  res.json(rows[0])
})

export default router

import { Router, Request, Response } from 'express'
import pool from '../db/pool.js'

const router = Router()

const STATUS_CALC = `
  CASE
    WHEN data_encerramento IS NOT NULL AND data_encerramento < CURRENT_DATE
      AND LOWER(status) IN ('aberto', 'em breve', 'em_breve')
    THEN 'Encerrado'
    WHEN LOWER(status) = 'aberto' THEN 'Aberto'
    WHEN LOWER(status) IN ('em_breve', 'em breve') THEN 'Em breve'
    WHEN LOWER(status) = 'encerrado' THEN 'Encerrado'
    WHEN LOWER(status) = 'suspenso' THEN 'Suspenso'
    WHEN LOWER(status) = 'resultado' THEN 'Resultado publicado'
    ELSE status
  END`

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Estatísticas gerais dos editais
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Números consolidados com regras da planilha
 */
router.get('/', async (_req: Request, res: Response) => {
  const [geral, porUf, porCategoria, porStatus, porModalidade, porPrioridade, porGoNogo, urgentes] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS total_editais,
             COUNT(DISTINCT fonte_id)::int AS total_fontes,
             COALESCE(SUM(renuncia_total_estimada), 0)::numeric AS valor_total_somado,
             COUNT(*) FILTER (WHERE ${STATUS_CALC} = 'Aberto')::int AS editais_abertos,
             COUNT(*) FILTER (WHERE ${STATUS_CALC} = 'Encerrado')::int AS editais_encerrados,
             COUNT(*) FILTER (WHERE ${STATUS_CALC} = 'Em breve')::int AS editais_em_breve,
             COUNT(*) FILTER (WHERE pode_pf = true)::int AS aceita_pf,
             COUNT(*) FILTER (WHERE pode_pj = true)::int AS aceita_pj
      FROM editais
    `),
    pool.query(`
      SELECT uf, COUNT(*)::int AS total
      FROM editais WHERE uf IS NOT NULL
      GROUP BY uf ORDER BY total DESC
    `),
    pool.query(`
      SELECT c.nome, c.slug, COUNT(e.id)::int AS total
      FROM categorias c LEFT JOIN editais e ON e.categoria_id = c.id
      GROUP BY c.id HAVING COUNT(e.id) > 0 ORDER BY total DESC
    `),
    pool.query(`
      SELECT ${STATUS_CALC} AS status, COUNT(*)::int AS total
      FROM editais GROUP BY 1 ORDER BY total DESC
    `),
    pool.query(`
      SELECT modalidade, COUNT(*)::int AS total
      FROM editais WHERE modalidade IS NOT NULL
      GROUP BY modalidade ORDER BY total DESC
    `),
    pool.query(`
      SELECT prioridade, COUNT(*)::int AS total
      FROM editais WHERE prioridade IS NOT NULL
      GROUP BY prioridade ORDER BY total DESC
    `),
    pool.query(`
      SELECT go_nogo, COUNT(*)::int AS total
      FROM editais WHERE go_nogo IS NOT NULL
      GROUP BY go_nogo ORDER BY total DESC
    `),
    pool.query(`
      SELECT id_edital, titulo, (data_encerramento - CURRENT_DATE)::int AS dias_restantes,
             prioridade, go_nogo
      FROM editais
      WHERE ${STATUS_CALC} = 'Aberto'
        AND data_encerramento IS NOT NULL
        AND (data_encerramento - CURRENT_DATE) <= 15
      ORDER BY data_encerramento ASC
    `),
  ])

  res.json({
    ...geral.rows[0],
    por_uf: porUf.rows,
    por_categoria: porCategoria.rows,
    por_status: porStatus.rows,
    por_modalidade: porModalidade.rows,
    por_prioridade: porPrioridade.rows,
    por_go_nogo: porGoNogo.rows,
    urgentes: urgentes.rows,
  })
})

export default router

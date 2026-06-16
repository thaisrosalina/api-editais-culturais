import { Router, Request, Response } from 'express'
import pool from '../db/pool.js'

const router = Router()

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Estatísticas gerais dos editais
 *     tags: [Estatísticas]
 *     responses:
 *       200:
 *         description: Números consolidados
 */
router.get('/', async (_req: Request, res: Response) => {
  const [geral, porUf, porCategoria, porStatus] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS total_editais,
             COUNT(DISTINCT fonte_id)::int AS total_fontes,
             COALESCE(SUM(valor_total), 0)::numeric AS valor_total_somado,
             COUNT(*) FILTER (WHERE status = 'aberto')::int AS editais_abertos
      FROM editais
    `),
    pool.query(`
      SELECT uf, COUNT(*)::int AS total
      FROM editais WHERE uf IS NOT NULL
      GROUP BY uf ORDER BY total DESC
    `),
    pool.query(`
      SELECT c.nome, c.slug, COUNT(e.id)::int AS total
      FROM categorias c
      LEFT JOIN editais e ON e.categoria_id = c.id
      GROUP BY c.id ORDER BY total DESC
    `),
    pool.query(`
      SELECT status, COUNT(*)::int AS total
      FROM editais GROUP BY status ORDER BY total DESC
    `),
  ])

  res.json({
    ...geral.rows[0],
    por_uf: porUf.rows,
    por_categoria: porCategoria.rows,
    por_status: porStatus.rows,
  })
})

export default router

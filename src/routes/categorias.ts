import { Router, Request, Response } from 'express'
import pool from '../db/pool.js'

const router = Router()

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Lista categorias culturais
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorias com contagem de editais
 */
router.get('/', async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`
    SELECT c.*, COUNT(e.id)::int AS total_editais
    FROM categorias c
    LEFT JOIN editais e ON e.categoria_id = c.id
    GROUP BY c.id
    ORDER BY c.nome
  `)
  res.json(rows)
})

export default router

import { Router, Request, Response } from 'express'
import pool from '../db/pool.js'

const router = Router()

/**
 * @swagger
 * /api/fontes:
 *   get:
 *     summary: Lista fontes de dados
 *     tags: [Fontes]
 *     responses:
 *       200:
 *         description: Lista de fontes com status de coleta
 */
router.get('/', async (_req: Request, res: Response) => {
  const { rows } = await pool.query(`
    SELECT f.*, COUNT(e.id)::int AS total_editais
    FROM fontes f
    LEFT JOIN editais e ON e.fonte_id = f.id
    GROUP BY f.id
    ORDER BY f.nome
  `)
  res.json(rows)
})

export default router

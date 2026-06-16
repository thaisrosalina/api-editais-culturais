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
 *         schema: { type: string, enum: [aberto, encerrado, resultado, suspenso] }
 *       - in: query
 *         name: uf
 *         schema: { type: string }
 *         description: Sigla do estado (ex. MG, SP)
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Slug da categoria (ex. artes-cenicas, circo)
 *       - in: query
 *         name: abrangencia
 *         schema: { type: string, enum: [municipal, estadual, nacional] }
 *       - in: query
 *         name: busca
 *         schema: { type: string }
 *         description: Busca por título ou descrição
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lista paginada de editais
 */
router.get('/', async (req: Request, res: Response) => {
  const { status, uf, categoria, abrangencia, busca, limite = '20', pagina = '1' } = req.query
  const lim = Math.min(Math.max(parseInt(limite as string, 10) || 20, 1), 100)
  const pag = Math.max(parseInt(pagina as string, 10) || 1, 1)
  const offset = (pag - 1) * lim
  const conditions: string[] = []
  const params: unknown[] = []
  let i = 1

  if (status) { conditions.push(`e.status = $${i++}`); params.push(status) }
  if (uf) { conditions.push(`e.uf = $${i++}`); params.push((uf as string).toUpperCase()) }
  if (categoria) { conditions.push(`c.slug = $${i++}`); params.push(categoria) }
  if (abrangencia) { conditions.push(`e.abrangencia = $${i++}`); params.push(abrangencia) }
  if (busca) {
    conditions.push(`(e.titulo ILIKE $${i} OR e.descricao ILIKE $${i})`)
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
    SELECT e.*, c.nome AS categoria_nome, c.slug AS categoria_slug,
           f.nome AS fonte_nome
    FROM editais e
    LEFT JOIN categorias c ON c.id = e.categoria_id
    LEFT JOIN fontes f ON f.id = e.fonte_id
    ${where}
    ORDER BY e.data_encerramento ASC NULLS LAST, e.criado_em DESC
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
 * /api/editais/{id}:
 *   get:
 *     summary: Detalha um edital
 *     tags: [Editais]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Edital encontrado
 *       404:
 *         description: Edital não encontrado
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { rows } = await pool.query(`
    SELECT e.*, c.nome AS categoria_nome, c.slug AS categoria_slug,
           f.nome AS fonte_nome, f.url_base AS fonte_url
    FROM editais e
    LEFT JOIN categorias c ON c.id = e.categoria_id
    LEFT JOIN fontes f ON f.id = e.fonte_id
    WHERE e.id = $1
  `, [req.params.id])

  if (!rows.length) { res.status(404).json({ erro: 'Edital não encontrado' }); return }
  res.json(rows[0])
})

export default router

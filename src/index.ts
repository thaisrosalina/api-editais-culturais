import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import cron from 'node-cron'
import { swaggerSpec } from './swagger.js'
import editaisRouter from './routes/editais.js'
import categoriasRouter from './routes/categorias.js'
import fontesRouter from './routes/fontes.js'
import statsRouter from './routes/stats.js'
import { executarColeta } from './scrapers/run.js'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '3002', 10)

app.use(cors())
app.use(express.json())

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Editais Culturais — Docs',
}))

app.get('/api/swagger.json', (_req, res) => res.json(swaggerSpec))

app.use('/api/editais', editaisRouter)
app.use('/api/categorias', categoriasRouter)
app.use('/api/fontes', fontesRouter)
app.use('/api/stats', statsRouter)

app.post('/api/coleta', async (_req, res) => {
  try {
    const resultados = await executarColeta()
    res.json({ sucesso: true, resultados })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    res.status(500).json({ sucesso: false, erro: msg })
  }
})

app.get('/', (_req, res) => {
  res.json({
    nome: 'API de Editais Culturais do Brasil',
    versao: '1.0.0',
    docs: `http://localhost:${PORT}/docs`,
    endpoints: {
      editais: '/api/editais',
      categorias: '/api/categorias',
      fontes: '/api/fontes',
      stats: '/api/stats',
      coleta: 'POST /api/coleta',
      swagger: '/api/swagger.json',
    },
  })
})

cron.schedule('0 6 * * *', () => {
  console.log('⏰ Coleta agendada (06:00)')
  executarColeta().catch(console.error)
})

app.listen(PORT, () => {
  console.log(`\n🚀 API Editais Culturais rodando em http://localhost:${PORT}`)
  console.log(`📖 Documentação Swagger em http://localhost:${PORT}/docs`)
  console.log(`⏰ Coleta automática agendada: diariamente às 06:00\n`)
})

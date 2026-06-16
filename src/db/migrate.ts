import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pool from './pool.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, 'migrations')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL UNIQUE,
        executada_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    const executadas = await client.query('SELECT nome FROM _migrations ORDER BY nome')
    const jaExecutadas = new Set(executadas.rows.map(r => r.nome))

    const arquivos = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

    for (const arquivo of arquivos) {
      if (jaExecutadas.has(arquivo)) {
        console.log(`  ✓ ${arquivo} (já executada)`)
        continue
      }
      const sql = readFileSync(join(migrationsDir, arquivo), 'utf-8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO _migrations (nome) VALUES ($1)', [arquivo])
        await client.query('COMMIT')
        console.log(`  ✅ ${arquivo}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`  ❌ ${arquivo}:`, err)
        throw err
      }
    }
    console.log('\nMigrações concluídas.')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(err => { console.error(err); process.exit(1) })

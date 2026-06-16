import { scrapeFunarte } from './funarte.js'
import { scrapeGovBrCultura } from './govbr-cultura.js'
import { scrapeProsa } from './prosas.js'
import { scrapeMapaCultural } from './mapacultural.js'

const scrapers = [
  { nome: 'Gov.br / MinC', fn: scrapeGovBrCultura },
  { nome: 'Funarte', fn: scrapeFunarte },
  { nome: 'Prosas', fn: scrapeProsa },
  { nome: 'Mapa Cultural', fn: scrapeMapaCultural },
]

export async function executarColeta() {
  console.log(`\n🔍 Iniciando coleta — ${new Date().toISOString()}`)
  const resultados: { nome: string; novos: number; erro?: string }[] = []

  for (const scraper of scrapers) {
    try {
      const novos = await scraper.fn()
      resultados.push({ nome: scraper.nome, novos })
      console.log(`  ✅ ${scraper.nome}: ${novos} novos editais`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      resultados.push({ nome: scraper.nome, novos: 0, erro: msg })
      console.error(`  ❌ ${scraper.nome}: ${msg}`)
    }
  }

  return resultados
}

if (process.argv[1]?.endsWith('run.js') || process.argv[1]?.endsWith('run.ts')) {
  executarColeta()
    .then(r => { console.log('\nResultado:', JSON.stringify(r, null, 2)); process.exit(0) })
    .catch(err => { console.error(err); process.exit(1) })
}

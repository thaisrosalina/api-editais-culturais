import { scrapeGovBr } from './govbr-cultura.js'
import { scrapeProsa } from './prosas.js'
import { scrapeMapaCultural } from './mapacultural.js'

const scrapers = [
  { nome: 'Gov.br (Cultura, Esporte, MMA, MCTI, Terceiro Setor, Funarte, FINEP, CNPq)', fn: scrapeGovBr },
  { nome: 'Prosas (15 buscas: cultura, social, inovação, meio ambiente, esporte)', fn: scrapeProsa },
  { nome: 'Mapa Cultural (API nacional)', fn: scrapeMapaCultural },
]

export async function executarColeta() {
  console.log(`\n🔍 Iniciando coleta — ${new Date().toISOString()}`)
  const resultados: { nome: string; novos: number; erro?: string }[] = []

  for (const scraper of scrapers) {
    try {
      console.log(`  🔄 ${scraper.nome}...`)
      const novos = await scraper.fn()
      resultados.push({ nome: scraper.nome, novos })
      console.log(`  ✅ ${scraper.nome}: ${novos} novos editais`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      resultados.push({ nome: scraper.nome, novos: 0, erro: msg })
      console.error(`  ❌ ${scraper.nome}: ${msg}`)
    }
  }

  const totalNovos = resultados.reduce((sum, r) => sum + r.novos, 0)
  console.log(`\n📊 Total: ${totalNovos} novos editais encontrados`)

  return resultados
}

if (process.argv[1]?.endsWith('run.js') || process.argv[1]?.endsWith('run.ts')) {
  executarColeta()
    .then(r => { console.log('\nResultado:', JSON.stringify(r, null, 2)); process.exit(0) })
    .catch(err => { console.error(err); process.exit(1) })
}

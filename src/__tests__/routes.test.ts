import { describe, it, expect } from 'vitest'

describe('API Routes', () => {
  it('deve ter módulo de editais exportando Router', async () => {
    const mod = await import('../routes/editais.js')
    expect(mod.default).toBeDefined()
  })

  it('deve ter módulo de categorias exportando Router', async () => {
    const mod = await import('../routes/categorias.js')
    expect(mod.default).toBeDefined()
  })

  it('deve ter módulo de stats exportando Router', async () => {
    const mod = await import('../routes/stats.js')
    expect(mod.default).toBeDefined()
  })

  it('deve ter módulo de fontes exportando Router', async () => {
    const mod = await import('../routes/fontes.js')
    expect(mod.default).toBeDefined()
  })

  it('deve gerar spec Swagger válida', async () => {
    const { swaggerSpec } = await import('../swagger.js')
    const spec = swaggerSpec as Record<string, unknown>
    expect(spec).toBeDefined()
    expect(spec.openapi).toBe('3.0.0')
    expect((spec.info as Record<string, unknown>).title).toContain('Editais')
    expect(spec.paths).toBeDefined()
  })
})

import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Editais Culturais do Brasil',
      version: '1.0.0',
      description: 'API pública que agrega editais de fomento à cultura de diversas fontes governamentais brasileiras. Dados coletados via scraping automatizado.',
      contact: {
        name: 'Thaís Oliveira',
        url: 'https://github.com/thaisrosalina',
      },
    },
    servers: process.env.RENDER_EXTERNAL_URL
      ? [
          { url: process.env.RENDER_EXTERNAL_URL, description: 'Produção (Render)' },
          { url: 'http://localhost:3002', description: 'Desenvolvimento' },
        ]
      : [
          { url: 'http://localhost:3002', description: 'Desenvolvimento' },
        ],
    tags: [
      { name: 'Editais', description: 'Consulta e filtragem de editais culturais' },
      { name: 'Categorias', description: 'Segmentos artísticos e culturais' },
      { name: 'Fontes', description: 'Fontes de dados públicos' },
      { name: 'Estatísticas', description: 'Números consolidados' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)

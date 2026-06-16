# 🎭 API de Editais Culturais do Brasil

[![CI](https://github.com/thaisrosalina/api-editais-culturais/actions/workflows/ci.yml/badge.svg)](https://github.com/thaisrosalina/api-editais-culturais/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)](http://localhost:3002/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

API REST pública que agrega editais de fomento à cultura de diversas fontes governamentais brasileiras. Coleta automatizada via web scraping com documentação interativa Swagger.

## Problema que resolve

Produtores culturais no Brasil precisam monitorar dezenas de sites diferentes (Funarte, secretarias estaduais, prefeituras, Diário Oficial) para encontrar editais de fomento. Esta API centraliza essas informações em um único ponto de consulta com filtros avançados.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Fontes Gov │────▶│  Scrapers    │────▶│  PostgreSQL 16 │
│  (7 sites)  │     │  (Cheerio)   │     │  (editais DB)  │
└─────────────┘     └──────────────┘     └───────┬────────┘
                          ▲ cron 06h             │
                          │                      ▼
                    ┌─────┴──────┐     ┌────────────────┐
                    │  node-cron │     │  Express API   │
                    └────────────┘     │  + Swagger UI  │
                                       └────────────────┘
```

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20+ |
| Linguagem | TypeScript 5 |
| Framework | Express 4 |
| Banco de Dados | PostgreSQL 16 |
| Scraping | Cheerio |
| Documentação | Swagger UI / OpenAPI 3.0 |
| Agendamento | node-cron |
| Testes | Vitest |
| CI/CD | GitHub Actions |
| Container | Docker Compose |

## Fontes de dados

| Fonte | Tipo | Abrangência |
|-------|------|-------------|
| Funarte | Scraping | Nacional |
| Sec. Cultura MG | Scraping | Estadual |
| Sec. Cultura SP | Scraping | Estadual |
| Sec. Cultura RJ | Scraping | Estadual |
| FMC Belo Horizonte | Scraping | Municipal |
| Mapas Culturais | API | Estadual |
| Diário Oficial da União | Scraping | Nacional |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/editais` | Lista editais com filtros (status, UF, categoria, busca) |
| GET | `/api/editais/:id` | Detalha um edital |
| GET | `/api/categorias` | Lista categorias culturais |
| GET | `/api/fontes` | Lista fontes de dados |
| GET | `/api/stats` | Estatísticas consolidadas |
| POST | `/api/coleta` | Dispara coleta manual |
| GET | `/docs` | Documentação Swagger interativa |

### Filtros disponíveis em `/api/editais`

| Parâmetro | Tipo | Exemplo |
|-----------|------|---------|
| `status` | string | `aberto`, `encerrado` |
| `uf` | string | `MG`, `SP`, `RJ` |
| `categoria` | string (slug) | `artes-cenicas`, `circo`, `musica` |
| `abrangencia` | string | `municipal`, `estadual`, `nacional` |
| `busca` | string | `festival dança` |
| `limite` | int (1-100) | `20` |
| `pagina` | int | `1` |

## Setup local

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Git

### Instalação

```bash
git clone https://github.com/thaisrosalina/api-editais-culturais.git
cd api-editais-culturais
npm install
cp .env.example .env
```

### Banco de dados

```bash
docker compose up -d
npx tsx src/db/migrate.ts
```

### Rodar

```bash
npx tsx src/index.ts
```

Acesse:
- API: http://localhost:3002
- Swagger: http://localhost:3002/docs

### Testes

```bash
npm test
```

### Coleta manual

```bash
npx tsx src/scrapers/run.ts
```

## Categorias culturais

A API organiza editais em 12 segmentos: Artes Cênicas, Artes Visuais, Audiovisual, Circo, Dança, Literatura, Música, Patrimônio Cultural, Cultura Popular, Cultura Digital, Multidisciplinar, Outros.

## Estrutura do projeto

```
api-editais-culturais/
├── src/
│   ├── db/
│   │   ├── pool.ts              # Conexão PostgreSQL
│   │   ├── migrate.ts           # Runner de migrações
│   │   └── migrations/
│   │       ├── 001-schema.sql   # Tabelas: fontes, categorias, editais, coletas_log
│   │       └── 002-seed.sql     # 7 fontes, 12 categorias, 10 editais exemplo
│   ├── routes/
│   │   ├── editais.ts           # CRUD + filtros paginados
│   │   ├── categorias.ts        # Listagem com contagem
│   │   ├── fontes.ts            # Fontes com status
│   │   └── stats.ts             # Estatísticas consolidadas
│   ├── scrapers/
│   │   ├── funarte.ts           # Scraper Funarte (Cheerio)
│   │   └── run.ts               # Executor de todos os scrapers
│   ├── swagger.ts               # Configuração OpenAPI
│   ├── index.ts                 # Servidor Express + cron
│   └── __tests__/
│       └── routes.test.ts       # Testes unitários
├── .github/workflows/ci.yml     # CI com PostgreSQL service
├── docker-compose.yml
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## Roadmap

- [ ] Scrapers para todas as 7 fontes
- [ ] Webhook de notificação para novos editais
- [ ] Cache com Redis
- [ ] Rate limiting
- [ ] Autenticação opcional (API key)
- [ ] Deploy na Railway / Render
- [ ] Frontend de consulta pública

## Licença

[MIT](LICENSE)

---

Desenvolvido por [Thaís Oliveira](https://github.com/thaisrosalina) — produtora cultural e desenvolvedora.

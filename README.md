# 🎭 API de Editais Culturais do Brasil

[![CI](https://github.com/thaisrosalina/api-editais-culturais/actions/workflows/ci.yml/badge.svg)](https://github.com/thaisrosalina/api-editais-culturais/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black)](http://localhost:3002/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

API REST pública que agrega editais de fomento à cultura de diversas fontes governamentais brasileiras. Coleta automatizada via web scraping, documentação Swagger interativa e integração com Google Sheets.

## Problema que resolve

Produtores culturais no Brasil precisam monitorar dezenas de sites diferentes (Funarte, secretarias estaduais, prefeituras, Diário Oficial) para encontrar editais de fomento. Esta API centraliza essas informações em um único ponto de consulta com filtros avançados e alimenta automaticamente uma planilha de monitoramento com 37 campos por edital.

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Fontes Gov │────▶│  Scrapers    │────▶│  PostgreSQL 16 │
│  (17 sites) │     │  (Cheerio)   │     │  (37 campos)   │
└─────────────┘     └──────────────┘     └───────┬────────┘
                          ▲ cron 06h             │
                          │                      ▼
                    ┌─────┴──────┐     ┌────────────────┐     ┌─────────────────┐
                    │  node-cron │     │  Express API   │────▶│  Google Sheets   │
                    └────────────┘     │  + Swagger UI  │     │  (Apps Script)   │
                                       └────────────────┘     └─────────────────┘
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
| GET | `/api/editais` | Lista editais com filtros avançados (37 campos por edital) |
| GET | `/api/editais/:id` | Detalha um edital (aceita ID numérico ou id_edital como `2026-001`) |
| GET | `/api/editais/export/csv` | Exporta em CSV compatível com Google Sheets |
| GET | `/api/categorias` | Lista categorias culturais com contagem |
| GET | `/api/fontes` | Lista fontes de dados com status |
| GET | `/api/stats` | Estatísticas: por UF, modalidade, prioridade, Go/No-Go, urgentes |
| POST | `/api/coleta` | Dispara coleta manual dos scrapers |
| GET | `/docs` | Documentação Swagger interativa |

### Filtros disponíveis em `/api/editais`

| Parâmetro | Tipo | Exemplo |
|-----------|------|---------|
| `status` | string | `aberto`, `encerrado`, `em_breve` |
| `uf` | string | `MG`, `SP`, `RJ` |
| `categoria` | string (slug) | `artes-cenicas`, `circo`, `musica` |
| `abrangencia` | string | `municipal`, `estadual`, `nacional`, `internacional` |
| `modalidade` | string | `PNAB - Fomento`, `Lei de Incentivo`, `Patrocínio direto` |
| `prioridade` | string | `Alta`, `Média`, `Baixa` |
| `go_nogo` | string | `Go`, `Avaliar`, `No-Go` |
| `pode_pf` | boolean | `true` (aceita pessoa física) |
| `pode_pj` | boolean | `true` (aceita pessoa jurídica) |
| `busca` | string | `festival dança` |
| `limite` | int (1-200) | `50` |
| `pagina` | int | `1` |

### Campos por edital (37 campos — espelha a planilha)

Identificação, órgão, localização (UF/município/abrangência), modalidade, status, datas (lançamento/abertura/encerramento), **dias_restantes** (calculado), elegibilidade (PF/PJ/domicílio/quantidade), critérios, setores, perfil alvo, valores (teto/renúncia), imposto incentivado, exigências (contrapartida/acessibilidade/prestação de contas), complexidade, links (edital/DOM/inscrição/fonte), coleta, responsável, prioridade, Go/No-Go com motivo, observações.

## Integração com Google Sheets

A API alimenta automaticamente a planilha de monitoramento. Arquivo `google-apps-script.js` incluso.

1. Abra a planilha no Google Sheets
2. Menu: **Extensões > Apps Script**
3. Cole o conteúdo de `google-apps-script.js`
4. Atualize `API_URL` para o endereço da API (deploy)
5. Execute `sincronizarEditais`

O script cria menu **"API Editais"** na planilha com:
- **Sincronizar editais** — importa todos os editais com formatação condicional automática
- **Configurar atualização diária** — cria gatilho para rodar às 7h todo dia

Regras de formatação condicional aplicadas automaticamente:
- Status: verde (aberto), amarelo (em breve), cinza (encerrado)
- Dias restantes: vermelho (expirado), laranja (≤7d), amarelo (8-15d), verde (>15d)
- Prioridade: vermelho (alta), amarelo (média), verde (baixa)
- Go/No-Go: verde (go), amarelo (avaliar), vermelho (no-go)

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
│   │       ├── 002-seed.sql     # Categorias e fontes iniciais
│   │       ├── 003-planilha-fields.sql  # 20+ campos da planilha de monitoramento
│   │       └── 004-seed-planilha.sql    # 16 editais reais (dados públicos 2026)
│   ├── routes/
│   │   ├── editais.ts           # Filtros avançados + paginação + export CSV
│   │   ├── categorias.ts        # Listagem com contagem
│   │   ├── fontes.ts            # Fontes com status
│   │   └── stats.ts             # Stats: UF, modalidade, prioridade, Go/No-Go, urgentes
│   ├── scrapers/
│   │   ├── funarte.ts           # Scraper Funarte (Cheerio)
│   │   └── run.ts               # Executor de todos os scrapers
│   ├── swagger.ts               # Configuração OpenAPI
│   ├── index.ts                 # Servidor Express + cron
│   └── __tests__/
│       └── routes.test.ts       # Testes unitários
├── google-apps-script.js        # Script de integração Google Sheets
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

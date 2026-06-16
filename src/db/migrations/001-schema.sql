CREATE TABLE IF NOT EXISTS fontes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  url_base VARCHAR(500) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'scraping',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultima_coleta TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS editais (
  id SERIAL PRIMARY KEY,
  fonte_id INT REFERENCES fontes(id),
  titulo VARCHAR(500) NOT NULL,
  orgao VARCHAR(300),
  descricao TEXT,
  categoria_id INT REFERENCES categorias(id),
  uf CHAR(2),
  municipio VARCHAR(200),
  abrangencia VARCHAR(50),
  valor_total NUMERIC(14,2),
  valor_por_projeto NUMERIC(14,2),
  data_publicacao DATE,
  data_abertura DATE,
  data_encerramento DATE,
  data_resultado DATE,
  link_edital VARCHAR(1000),
  link_inscricao VARCHAR(1000),
  status VARCHAR(30) NOT NULL DEFAULT 'aberto',
  tipo_proponente VARCHAR(50),
  tags TEXT[],
  hash_unico VARCHAR(64) NOT NULL UNIQUE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_editais_status ON editais(status);
CREATE INDEX IF NOT EXISTS idx_editais_uf ON editais(uf);
CREATE INDEX IF NOT EXISTS idx_editais_categoria ON editais(categoria_id);
CREATE INDEX IF NOT EXISTS idx_editais_encerramento ON editais(data_encerramento);
CREATE INDEX IF NOT EXISTS idx_editais_hash ON editais(hash_unico);

CREATE TABLE IF NOT EXISTS coletas_log (
  id SERIAL PRIMARY KEY,
  fonte_id INT REFERENCES fontes(id),
  inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  fim TIMESTAMP,
  editais_encontrados INT DEFAULT 0,
  editais_novos INT DEFAULT 0,
  erro TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'rodando'
);

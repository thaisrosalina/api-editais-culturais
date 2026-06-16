-- Novos campos baseados na planilha de monitoramento
ALTER TABLE editais
  ADD COLUMN IF NOT EXISTS id_edital VARCHAR(20),
  ADD COLUMN IF NOT EXISTS modalidade VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pode_pf BOOLEAN,
  ADD COLUMN IF NOT EXISTS pode_pj BOOLEAN,
  ADD COLUMN IF NOT EXISTS exige_domicilio_local BOOLEAN,
  ADD COLUMN IF NOT EXISTS qtd_projetos_por_proponente VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pontuacao_minima VARCHAR(50),
  ADD COLUMN IF NOT EXISTS criterio_aprovacao VARCHAR(200),
  ADD COLUMN IF NOT EXISTS setores TEXT[],
  ADD COLUMN IF NOT EXISTS subsetores_obs TEXT,
  ADD COLUMN IF NOT EXISTS perfil_alvo TEXT,
  ADD COLUMN IF NOT EXISTS imposto_incentivado VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contrapartida_obrigatoria BOOLEAN,
  ADD COLUMN IF NOT EXISTS exige_acessibilidade BOOLEAN,
  ADD COLUMN IF NOT EXISTS exige_prestacao_contas BOOLEAN,
  ADD COLUMN IF NOT EXISTS nivel_complexidade VARCHAR(20),
  ADD COLUMN IF NOT EXISTS link_dom VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS fonte_encontrada VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS data_coleta DATE,
  ADD COLUMN IF NOT EXISTS responsavel_interno VARCHAR(200),
  ADD COLUMN IF NOT EXISTS prioridade VARCHAR(20),
  ADD COLUMN IF NOT EXISTS go_nogo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS motivo_go_nogo TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE editais
  RENAME COLUMN valor_por_projeto TO teto_por_projeto;
ALTER TABLE editais
  RENAME COLUMN valor_total TO renuncia_total_estimada;

CREATE UNIQUE INDEX IF NOT EXISTS idx_editais_id_edital ON editais(id_edital);
CREATE INDEX IF NOT EXISTS idx_editais_modalidade ON editais(modalidade);
CREATE INDEX IF NOT EXISTS idx_editais_prioridade ON editais(prioridade);
CREATE INDEX IF NOT EXISTS idx_editais_go_nogo ON editais(go_nogo);

-- Limpa seed anterior (dados exemplo) e insere editais reais da planilha
DELETE FROM editais;

-- Ajusta fontes para refletir as reais da planilha
DELETE FROM fontes;
INSERT INTO fontes (nome, url_base, tipo) VALUES
  ('Agência Brasil / EBC', 'https://agenciabrasil.ebc.com.br', 'scraping'),
  ('Secretaria de Cultura de SC', 'https://www.cultura.sc.gov.br', 'scraping'),
  ('Prefeitura de SP', 'https://prefeitura.sp.gov.br', 'scraping'),
  ('Instituto Cultural Vale', 'https://institutoculturalvale.org', 'scraping'),
  ('Jornal de Brasília', 'https://jornaldebrasilia.com.br', 'scraping'),
  ('Gov.br / MinC', 'https://www.gov.br/cultura', 'scraping'),
  ('BRB Law', 'https://www.brblaw.com.br', 'scraping'),
  ('Revista Continente', 'https://revistacontinente.com.br', 'scraping'),
  ('Secretaria de Cultura PE', 'https://www.cultura.pe.gov.br', 'scraping'),
  ('Secretaria de Cultura MG', 'https://www.secult.mg.gov.br', 'scraping'),
  ('RioFilme', 'https://prefeitura.rio/riofilme', 'scraping'),
  ('SESI-SP', 'https://www.sesisp.org.br', 'scraping'),
  ('Prosas', 'https://prosas.com.br', 'scraping'),
  ('Funarte', 'https://www.gov.br/funarte/pt-br', 'scraping'),
  ('Diário Oficial da União', 'https://www.in.gov.br/web/dou', 'scraping'),
  ('Fundação Municipal de Cultura de BH', 'https://prefeitura.pbh.gov.br/fundacao-municipal-de-cultura', 'scraping'),
  ('Mapa Cultural (Mapas Culturais)', 'https://mapacultural.secult.ce.gov.br', 'api')
ON CONFLICT DO NOTHING;

-- Ajusta categorias para refletir setores da planilha
INSERT INTO categorias (nome, slug) VALUES
  ('Economia Criativa', 'economia-criativa'),
  ('Território/Comunidade', 'territorio-comunidade'),
  ('Diversidade', 'diversidade'),
  ('Inovação', 'inovacao'),
  ('Esporte', 'esporte'),
  ('Povos Indígenas', 'povos-indigenas')
ON CONFLICT DO NOTHING;

-- 2026-001
INSERT INTO editais (
  id_edital, titulo, orgao, uf, municipio, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  teto_por_projeto, renuncia_total_estimada, imposto_incentivado,
  contrapartida_obrigatoria, exige_acessibilidade, exige_prestacao_contas,
  nivel_complexidade, link_edital, link_inscricao, fonte_encontrada,
  data_coleta, responsavel_interno, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-001',
  'Edital de Apoio a Ações Culturais Continuadas RJ',
  'Secretaria de Estado de Cultura e Economia Criativa do RJ (SECEC-RJ)',
  'RJ', NULL, 'estadual', 'PNAB - Fomento', 'aberto',
  '2026-04-27', '2026-04-27', '2026-05-18',
  false, true, true,
  ARRAY['Cultura', 'Economia criativa', 'Território/Comunidade'],
  'Projetos culturais contínuos. Recursos PNAB. Dois ciclos (2026 e 2027) de R$ 9,6 mi cada.',
  'Empresa cultural (PJ); Produtora (PJ); MEI; OSC/Associação',
  NULL, 19200000, NULL,
  true, true, true,
  'Média',
  'https://cultura.rj.gov.br/acoes-continuadas/',
  'https://desenvolvecultura.rj.gov.br/',
  'https://agenciabrasil.ebc.com.br/cultura/noticia/2026-04/edital-para-acoes-culturais-continuas-abre-inscricoes-no-rio',
  '2026-05-01', 'Thais Oliveira', 'Alta', 'Go',
  'PNAB com R$19,2M, ações culturais contínuas, perfil PJ/MEI compatível, prazo viável (~17 dias).',
  'Exige até 3 anos de atuação comprovada no estado. Acessibilidade e sustentabilidade obrigatórias.',
  'planilha-2026-001',
  (SELECT id FROM fontes WHERE nome = 'Agência Brasil / EBC'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

-- 2026-002
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada, imposto_incentivado,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, fonte_encontrada,
  data_coleta, responsavel_interno, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-002',
  'Edital Revitaliza SC – PNAB 2ª Edição',
  'Fundação Catarinense de Cultura (FCC)',
  'SC', 'estadual', 'PNAB - Fomento', 'aberto',
  '2026-04-04', '2026-04-04', '2026-05-04',
  true, true, true,
  ARRAY['Cultura', 'Patrimônio', 'Economia criativa'],
  'Revitalização de espaços e ações culturais. Recursos PNAB.',
  'Artista individual (PF); Coletivo informal; OSC/Associação; Empresa cultural (PJ)',
  NULL, NULL,
  true, 'Média',
  'https://www.cultura.sc.gov.br/editais-e-acoes/editais',
  'https://www.cultura.sc.gov.br/editais-e-acoes/editais',
  '2026-05-01', 'Isabela Cunha', 'Alta', 'Go',
  'PNAB SC, perfil amplo (PF/PJ), prazo apertado (~3 dias) — atenção urgente.',
  'Encerra 04/05/2026. Validar exigência de domicílio em SC.',
  'planilha-2026-002',
  (SELECT id FROM fontes WHERE nome = 'Secretaria de Cultura de SC'),
  (SELECT id FROM categorias WHERE slug = 'patrimonio-cultural')
);

-- 2026-003
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  contrapartida_obrigatoria, exige_acessibilidade, exige_prestacao_contas,
  nivel_complexidade, link_edital, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-003',
  'Edital SC Cultura Viva 2026',
  'Fundação Catarinense de Cultura (FCC)',
  'SC', 'estadual', 'PNAB - Fomento', 'aberto',
  '2026-04-17', '2026-04-17', '2026-05-18',
  false, true, true,
  ARRAY['Cultura popular/Tradicional', 'Território/Comunidade', 'Diversidade'],
  'Seleção de 47 Pontos de Cultura e 3 Pontões de Cultura. Rede Estadual de Cultura SC.',
  'OSC/Associação; Cooperativa; Coletivo informal (via PJ apoiadora)',
  NULL,
  true, true, true,
  'Média',
  'https://www.cultura.sc.gov.br/editais-e-acoes/editais',
  'https://www.cultura.sc.gov.br/editais-e-acoes/editais',
  '2026-05-01', 'Alta', 'Go',
  'Pontos de Cultura + PNAB, alta aderência a impacto social/territorial; prazo confortável (~17 dias).',
  'Verificar se exige certificação de Ponto de Cultura prévia. Domicílio em SC obrigatório.',
  'planilha-2026-003',
  (SELECT id FROM fontes WHERE nome = 'Secretaria de Cultura de SC'),
  (SELECT id FROM categorias WHERE slug = 'cultura-popular')
);

-- 2026-004
INSERT INTO editais (
  id_edital, titulo, orgao, uf, municipio, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  imposto_incentivado, contrapartida_obrigatoria,
  exige_acessibilidade, exige_prestacao_contas,
  nivel_complexidade, link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-004',
  'PROMAC 2026 — Programa Municipal de Apoio a Projetos Culturais',
  'Secretaria Municipal de Cultura e Economia Criativa (SP)',
  'SP', 'São Paulo', 'municipal', 'Lei de Incentivo', 'aberto',
  '2026-03-26', '2026-03-26', '2026-05-26',
  true, true, true,
  ARRAY['Cultura', 'Audiovisual', 'Música', 'Artes visuais', 'Artes cênicas', 'Literatura/Leitura', 'Patrimônio', 'Economia criativa'],
  'Renúncia 100% de ISS e IPTU municipal.',
  'Artista individual (PF); MEI; Empresa cultural (PJ); Produtora (PJ); OSC/Associação',
  'ISS', true,
  true, true,
  'Alta',
  'https://portadeentrada.prefeitura.sp.gov.br/promac/',
  'https://smcpromac.prefeitura.sp.gov.br/',
  'https://prefeitura.sp.gov.br/web/se/w/prefeitura-de-s%C3%A3o-paulo-abre-inscri%C3%A7%C3%B5es-para-edital-do-programa-municipal-de-apoio-a-projetos-culturais-promac-2026',
  '2026-05-01', 'Alta', 'Go',
  'Lei de incentivo robusta (ISS+IPTU), perfil amplo, prazo confortável (~25 dias). Excelente para projetos de SP.',
  'Exige residência ou sede em SP há pelo menos 2 anos. Captação via empresas/contribuintes.',
  'planilha-2026-004',
  (SELECT id FROM fontes WHERE nome = 'Prefeitura de SP'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

-- 2026-005
INSERT INTO editais (
  id_edital, titulo, orgao, uf, municipio, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-005',
  'PNAB Prefeitura de SP — 5 editais (R$ 34,5 milhões)',
  'Secretaria Municipal de Cultura e Economia Criativa (SP)',
  'SP', 'São Paulo', 'municipal', 'PNAB - Fomento', 'aberto',
  '2026-04-27', '2026-04-27', '2026-05-29',
  true, true, true,
  ARRAY['Cultura', 'Diversidade', 'Povos indígenas', 'Território/Comunidade', 'Economia criativa'],
  'Cinco editais (2º ciclo PNAB municipal SP), inclui edital específico para cultura indígena pela primeira vez.',
  'Artista individual (PF); Coletivo informal; OSC/Associação; MEI; Empresa cultural (PJ)',
  34500000,
  true, 'Média',
  'https://prefeitura.sp.gov.br/w/prefeitura-lan%C3%A7a-editais-de-r-34-5-milh%C3%B5es-para-fortalecer-a-cultura-na-cidade',
  'https://prefeitura.sp.gov.br/w/prefeitura-lan%C3%A7a-editais-de-r-34-5-milh%C3%B5es-para-fortalecer-a-cultura-na-cidade',
  '2026-05-01', 'Alta', 'Go',
  'PNAB municipal SP com 5 editais, R$34,5M, foco em diversidade/territórios/indígenas — alta aderência.',
  'Verificar bases específicas de cada um dos 5 editais separadamente.',
  'planilha-2026-005',
  (SELECT id FROM fontes WHERE nome = 'Prefeitura de SP'),
  (SELECT id FROM categorias WHERE slug = 'diversidade')
);

-- 2026-006
INSERT INTO editais (
  id_edital, titulo, orgao, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local, qtd_projetos_por_proponente,
  setores, subsetores_obs, perfil_alvo,
  teto_por_projeto, renuncia_total_estimada,
  contrapartida_obrigatoria, exige_acessibilidade, exige_prestacao_contas,
  nivel_complexidade, link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-006',
  'Edital Instituto Cultural Vale 2026',
  'Instituto Cultural Vale',
  'nacional', 'Patrocínio direto', 'aberto',
  '2026-04-21', '2026-04-21', '2026-05-15',
  false, true, false, '3',
  ARRAY['Cultura', 'Audiovisual', 'Música', 'Artes visuais', 'Artes cênicas', 'Patrimônio'],
  '7 áreas: artes cênicas, humanidades, artes visuais, música, patrimônio, museus/memória, audiovisual.',
  'Empresa cultural (PJ); Produtora (PJ); MEI; OSC/Associação',
  1500000, 30000000,
  true, true, true,
  'Média',
  'https://institutoculturalvale.org/',
  'https://institutoculturalvale.org/',
  'https://jornaltempoetica.com.br/2026/04/instituto-cultural-vale-abre-inscricoes-para-edital-nacional-com-r-30-milhoes-destinados-a-cultura-em-2026/',
  '2026-05-01', 'Alta', 'Go',
  'R$30M nacional, teto R$1,5M/projeto, 7 áreas, PJ com CNPJ cultural ativo. Prazo viável (~14 dias).',
  'Até 3 propostas por proponente. Inscrição 100% digital.',
  'planilha-2026-006',
  (SELECT id FROM fontes WHERE nome = 'Instituto Cultural Vale'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

-- 2026-007
INSERT INTO editais (
  id_edital, titulo, orgao, uf, municipio, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, link_dom, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-007',
  'Edital FAC nº 06/2026 — Demais Áreas (Distrito Federal)',
  'Secretaria de Cultura e Economia Criativa do DF (SUFIC)',
  'DF', 'Brasília', 'estadual', 'Edital específico', 'em_breve',
  '2026-04-30', '2026-05-07', '2026-06-05',
  true, true, true,
  ARRAY['Cultura', 'Artes cênicas', 'Música', 'Patrimônio', 'Economia criativa', 'Diversidade'],
  'Inclui hip hop, gastronomia, patrimônio. PF e PJ com cadastro ativo no Ceac-DF.',
  'Artista individual (PF); MEI; Empresa cultural (PJ); OSC/Associação',
  36000000,
  true, 'Média',
  'https://www.cultura.df.gov.br/',
  'https://www.dodf.df.gov.br/',
  'https://jornaldebrasilia.com.br/viva/anoteai/edital-do-fac-destina-r-36-milhoes-a-projetos-culturais-no-df/',
  '2026-05-01', 'Alta', 'Avaliar',
  'Edital amplo (R$36M) com inscrições abrindo em 7 dias — preparar documentação. Exige cadastro Ceac-DF prévio.',
  'Domicílio/sede em DF provável. Verificar publicação no DODF.',
  'planilha-2026-007',
  (SELECT id FROM fontes WHERE nome = 'Jornal de Brasília'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

-- 2026-008
INSERT INTO editais (
  id_edital, titulo, orgao, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-008',
  'Chamada Fundo Internacional para a Diversidade Cultural (FIDC/IFCD) — 17ª edição',
  'UNESCO / MinC',
  'internacional', 'Edital específico', 'aberto',
  '2026-03-01', '2026-03-01', '2026-05-06',
  false, true, false,
  ARRAY['Cultura', 'Diversidade', 'Economia criativa', 'Inovação'],
  'Cooperação internacional. Apoio a políticas públicas e cadeias produtivas da economia criativa.',
  'OSC/Associação; Fundação; Instituição pública; Empresa cultural (PJ)',
  true, 'Alta',
  'https://www.gov.br/cultura/pt-br/assuntos/noticias/minc-divulga-chamada-para-financiamento-do-fundo-para-a-diversidade-cultural-da-unesco-e-incentiva-participacao-de-projetos-brasileiros',
  'https://www.gov.br/cultura/pt-br/assuntos/noticias/minc-divulga-chamada-para-financiamento-do-fundo-para-a-diversidade-cultural-da-unesco-e-incentiva-participacao-de-projetos-brasileiros',
  '2026-05-01', 'Média', 'Avaliar',
  'Fundo internacional, alta complexidade documental e seleção competitiva. Prazo curto (~5 dias).',
  'Inscrição em inglês/francês/espanhol. Pré-seleção via MinC antes do envio à UNESCO.',
  'planilha-2026-008',
  (SELECT id FROM fontes WHERE nome = 'Gov.br / MinC'),
  (SELECT id FROM categorias WHERE slug = 'diversidade')
);

-- 2026-009
INSERT INTO editais (
  id_edital, titulo, orgao, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada, imposto_incentivado,
  contrapartida_obrigatoria, exige_prestacao_contas,
  nivel_complexidade, link_edital, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-009',
  'Edital Brasilidades 2026 — Ambev',
  'Ambev',
  'nacional', 'Lei de Incentivo', 'aberto',
  '2026-03-01', '2026-03-01', '2026-09-30',
  false, true, true,
  ARRAY['Cultura', 'Economia criativa', 'Esporte'],
  'Captação via 27 leis estaduais de incentivo (cultura e esporte). Patrocínio Ambev.',
  'Empresa cultural (PJ); Produtora (PJ); OSC/Associação',
  67000000, 'ICMS',
  true, true,
  'Alta',
  'https://www.brblaw.com.br/novos-editais-culturais-com-inscricoes-abertas-confira-71/',
  'https://www.brblaw.com.br/novos-editais-culturais-com-inscricoes-abertas-confira-71/',
  '2026-05-01', 'Média', 'Avaliar',
  'Janela longa (até set/2026), R$67M, mas exige projeto já aprovado em lei estadual de incentivo (ICMS).',
  'Pressupõe projeto aprovado em lei estadual; pode demandar parceria com produtora local.',
  'planilha-2026-009',
  (SELECT id FROM fontes WHERE nome = 'BRB Law'),
  (SELECT id FROM categorias WHERE slug = 'economia-criativa')
);

-- 2026-010
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-010',
  'Funcultura Música 2026 — Pernambuco',
  'Fundarpe / Secretaria de Cultura PE',
  'PE', 'estadual', 'Edital específico', 'aberto',
  '2026-04-01', '2026-04-01', '2026-04-30',
  true, true, true,
  ARRAY['Música', 'Economia criativa', 'Cultura popular/Tradicional'],
  '9 categorias: circulação, festivais, gravação, produtos/conteúdos, economia da cultura, manutenção bandas/corais, difusão equipamentos, formação, pesquisa.',
  'Artista individual (PF); MEI; Empresa cultural (PJ); OSC/Associação',
  5070000,
  true, 'Média',
  'https://www.cultura.pe.gov.br/funcultura/',
  'https://www.mapacultural.pe.gov.br/',
  'https://revistacontinente.com.br/secoes/noticias/inscricoes-para-o-funcultura-musica-2026-comecam-nesta-quarta-feira',
  '2026-05-01', 'Média', 'No-Go',
  'Encerra hoje (30/04) — prazo inviável para preparar inscrição completa. Registrar para próximo ciclo.',
  'Exige cadastro CPC ativo e residência mínima de 1 ano em PE.',
  'planilha-2026-010',
  (SELECT id FROM fontes WHERE nome = 'Revista Continente'),
  (SELECT id FROM categorias WHERE slug = 'musica')
);

-- 2026-011
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-011',
  'Funcultura Audiovisual 2025/2026 — Pernambuco',
  'Fundarpe / Secretaria de Cultura PE',
  'PE', 'estadual', 'Edital específico', 'encerrado',
  '2026-01-01', '2026-01-01', '2026-02-06',
  true, true, true,
  ARRAY['Audiovisual', 'Cultura'],
  '14 categorias. Resultado previsto até 31/07/2026.',
  'Artista individual (PF); MEI; Empresa cultural (PJ); Produtora (PJ)',
  11310000,
  true, 'Alta',
  'https://www.cultura.pe.gov.br/editais/funcultura-audiovisual-20252026/',
  'https://www.mapacultural.pe.gov.br/',
  'https://www.cultura.pe.gov.br/encerram-se-nesta-sexta-6-as-inscricoes-para-o-funcultura-audiovisual/',
  '2026-05-01', 'Baixa', 'No-Go',
  'Inscrições encerradas em 06/02/2026. Aguardar resultado e próximo ciclo.',
  'Exige cadastro CPC e domicílio em PE há ≥1 ano.',
  'planilha-2026-011',
  (SELECT id FROM fontes WHERE nome = 'Secretaria de Cultura PE'),
  (SELECT id FROM categorias WHERE slug = 'audiovisual')
);

-- 2026-012
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  contrapartida_obrigatoria, exige_acessibilidade, exige_prestacao_contas,
  nivel_complexidade, link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-012',
  'PNAB MG Edital 04/2026 — Execução Cultural',
  'Secretaria de Estado de Cultura e Turismo de MG (Secult-MG)',
  'MG', 'estadual', 'PNAB - Fomento', 'encerrado',
  '2026-02-23', '2026-02-23', '2026-03-23',
  true, true, true,
  ARRAY['Cultura', 'Patrimônio', 'Artes cênicas', 'Música', 'Território/Comunidade'],
  '5 categorias: formação; memória/arquivo; festivais; criação artística; manutenção de grupos/coletivos/espaços. 1.149 projetos.',
  'Artista individual (PF); Coletivo informal; OSC/Associação; MEI; Empresa cultural (PJ)',
  47270000,
  true, true, true,
  'Média',
  'https://www.secult.mg.gov.br/editais/editais-pnab/editais-pnab',
  'https://descentra.cultura.mg.gov.br/',
  'https://www.secult.mg.gov.br/noticias-artigos/8776-com-investimento-de-r-100-7-milhoes-minas-gerais-lanca-editais-do-segundo-ciclo-da-pnab-e-linha-inedita-para-povos-indigenas',
  '2026-05-01', 'Baixa', 'No-Go',
  'Inscrições encerradas em 23/03/2026. Registrar para próximo ciclo PNAB-MG.',
  'Domicílio em MG. Plataforma Descentra.',
  'planilha-2026-012',
  (SELECT id FROM fontes WHERE nome = 'Secretaria de Cultura MG'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

-- 2026-013
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  contrapartida_obrigatoria, exige_prestacao_contas,
  nivel_complexidade, link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-013',
  'PNAB MG Edital 02/2026 — Premiação Cultural',
  'Secretaria de Estado de Cultura e Turismo de MG (Secult-MG)',
  'MG', 'estadual', 'Premiação', 'encerrado',
  '2026-02-23', '2026-02-23', '2026-03-23',
  true, true, true,
  ARRAY['Cultura', 'Patrimônio', 'Diversidade', 'Cultura popular/Tradicional'],
  '1.411 prêmios para reconhecimento de trajetórias artísticas e culturais em MG.',
  'Artista individual (PF); Mestre da cultura popular; Coletivo informal; OSC/Associação',
  32100000,
  false, true,
  'Baixa',
  'https://www.secult.mg.gov.br/editais/editais-pnab/editais-pnab',
  'https://descentra.cultura.mg.gov.br/',
  'https://www.secult.mg.gov.br/noticias-artigos/8776-com-investimento-de-r-100-7-milhoes-minas-gerais-lanca-editais-do-segundo-ciclo-da-pnab-e-linha-inedita-para-povos-indigenas',
  '2026-05-01', 'Baixa', 'No-Go',
  'Inscrições encerradas em 23/03/2026.',
  'Premiação com prestação simplificada.',
  'planilha-2026-013',
  (SELECT id FROM fontes WHERE nome = 'Secretaria de Cultura MG'),
  (SELECT id FROM categorias WHERE slug = 'cultura-popular')
);

-- 2026-014
INSERT INTO editais (
  id_edital, titulo, orgao, uf, municipio, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  renuncia_total_estimada,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-014',
  'Programa de Fomento ao Audiovisual Carioca 2026 (1ª etapa)',
  'RioFilme — Prefeitura do Rio de Janeiro',
  'RJ', 'Rio de Janeiro', 'municipal', 'PNAB - Fomento', 'encerrado',
  '2026-01-23', '2026-01-23', '2026-02-22',
  true, true, true,
  ARRAY['Audiovisual', 'Cultura'],
  'Curtas-metragens, ações locais (cineclubes, mostras, festivais), apoio a festivais internacionais.',
  'Artista individual (PF); MEI; Empresa cultural (PJ); Produtora (PJ); OSC/Associação',
  5300000,
  true, 'Alta',
  'https://prefeitura.rio/riofilme/',
  'https://prefeitura.rio/riofilme/riofilme-abre-inscricoes-para-o-programa-de-fomento-ao-audiovisual-carioca-2026/',
  '2026-05-01', 'Baixa', 'No-Go',
  'Encerrou em 22/02/2026. Acompanhar 2ª etapa.',
  'Domicílio no município do Rio.',
  'planilha-2026-014',
  (SELECT id FROM fontes WHERE nome = 'RioFilme'),
  (SELECT id FROM categorias WHERE slug = 'audiovisual')
);

-- 2026-015
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-015',
  'Edital de Chamamento Território SESI-SP 2026',
  'SESI-SP',
  'SP', 'estadual', 'Chamada pública', 'encerrado',
  '2026-02-13', '2026-02-13', '2026-03-30',
  true, true, true,
  ARRAY['Artes visuais', 'Artes cênicas', 'Música', 'Literatura/Leitura'],
  'Ocupação dos espaços culturais SESI-SP em diferentes regiões do estado.',
  'Artista individual (PF); MEI; Empresa cultural (PJ); Produtora (PJ); OSC/Associação',
  true, 'Média',
  'https://www.sesisp.org.br/cultura/editais',
  'https://www.sesisp.org.br/cultura/sesi-sp-lanca-edital-de-chamamento-territorio-2026-e-amplia-acesso-a-producao-cultural-no-estado-de-sao-paulo',
  '2026-05-01', 'Baixa', 'No-Go',
  'Inscrições encerradas em 30/03/2026. Acompanhar próximo ciclo.',
  'Sistema de Captação de Projetos Culturais SESI-SP.',
  'planilha-2026-015',
  (SELECT id FROM fontes WHERE nome = 'SESI-SP'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

-- 2026-016
INSERT INTO editais (
  id_edital, titulo, orgao, uf, abrangencia, modalidade, status,
  data_publicacao, data_abertura, data_encerramento,
  pode_pf, pode_pj, exige_domicilio_local,
  setores, subsetores_obs, perfil_alvo,
  exige_prestacao_contas, nivel_complexidade,
  link_edital, link_inscricao, fonte_encontrada,
  data_coleta, prioridade, go_nogo, motivo_go_nogo,
  observacoes, hash_unico, fonte_id, categoria_id
) VALUES (
  '2026-016',
  'Edital de Ocupação Artística — Banco do Nordeste 2026',
  'Banco do Nordeste do Brasil (BNB)',
  'CE', 'regional', 'Chamada pública', 'aberto',
  '2026-03-01', '2026-03-01', '2026-06-30',
  true, true, true,
  ARRAY['Cultura', 'Artes cênicas', 'Música', 'Artes visuais', 'Território/Comunidade'],
  'Ocupação e circulação artística nos centros culturais BNB e parceiros (Fortaleza, Sousa, Cariri etc.).',
  'Artista individual (PF); MEI; Empresa cultural (PJ); Produtora (PJ); OSC/Associação',
  true, 'Baixa',
  'https://prosas.com.br/editais/15982',
  'https://prosas.com.br/editais/15982',
  'https://prosas.com.br/editais/15982',
  '2026-05-01', 'Média', 'Avaliar',
  'Boa janela para projetos no NE; sem grande contrapartida; cachê fixo por apresentação.',
  'Verificar regiões priorizadas e categorias específicas no edital.',
  'planilha-2026-016',
  (SELECT id FROM fontes WHERE nome = 'Prosas'),
  (SELECT id FROM categorias WHERE slug = 'multidisciplinar')
);

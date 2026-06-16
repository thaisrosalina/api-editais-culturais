-- Fontes de dados públicos de editais culturais
INSERT INTO fontes (nome, url_base, tipo) VALUES
  ('Funarte', 'https://www.gov.br/funarte/pt-br', 'scraping'),
  ('Secretaria de Cultura de MG', 'https://www.cultura.mg.gov.br', 'scraping'),
  ('Secretaria de Cultura de SP', 'https://www.cultura.sp.gov.br', 'scraping'),
  ('Secretaria de Cultura do RJ', 'https://www.cultura.rj.gov.br', 'scraping'),
  ('Fundação Municipal de Cultura de BH', 'https://prefeitura.pbh.gov.br/fundacao-municipal-de-cultura', 'scraping'),
  ('Mapa Cultural (Mapas Culturais)', 'https://mapacultural.secult.ce.gov.br', 'api'),
  ('Diário Oficial da União', 'https://www.in.gov.br/web/dou', 'scraping')
ON CONFLICT DO NOTHING;

-- Categorias culturais (segmentos artísticos)
INSERT INTO categorias (nome, slug) VALUES
  ('Artes Cênicas', 'artes-cenicas'),
  ('Artes Visuais', 'artes-visuais'),
  ('Audiovisual', 'audiovisual'),
  ('Circo', 'circo'),
  ('Dança', 'danca'),
  ('Literatura', 'literatura'),
  ('Música', 'musica'),
  ('Patrimônio Cultural', 'patrimonio-cultural'),
  ('Cultura Popular', 'cultura-popular'),
  ('Cultura Digital', 'cultura-digital'),
  ('Multidisciplinar', 'multidisciplinar'),
  ('Outros', 'outros')
ON CONFLICT DO NOTHING;

-- Editais de exemplo (dados reais públicos)
INSERT INTO editais (fonte_id, titulo, orgao, descricao, categoria_id, uf, municipio, abrangencia, valor_total, valor_por_projeto, data_publicacao, data_abertura, data_encerramento, link_edital, status, tipo_proponente, tags, hash_unico) VALUES
(
  1, 'Edital Funarte de Apoio a Ações Continuadas 2026',
  'Funarte / Ministério da Cultura',
  'Apoio financeiro a projetos de manutenção de atividades artísticas e culturais continuadas em todo o território nacional. Contempla grupos, companhias, coletivos e organizações culturais com atuação comprovada.',
  (SELECT id FROM categorias WHERE slug='multidisciplinar'), NULL, NULL, 'nacional',
  15000000, 200000,
  '2026-03-15', '2026-04-01', '2026-07-30',
  'https://www.gov.br/funarte/editais/acoes-continuadas-2026',
  'aberto', 'PJ',
  ARRAY['funarte', 'ações continuadas', 'manutenção', 'grupos'],
  'funarte-acoes-continuadas-2026'
),
(
  1, 'Edital Funarte Artes Cênicas — Circulação Nacional 2026',
  'Funarte / Ministério da Cultura',
  'Seleção de projetos de circulação de espetáculos de artes cênicas (teatro, dança, circo, ópera) por pelo menos 3 estados brasileiros.',
  (SELECT id FROM categorias WHERE slug='artes-cenicas'), NULL, NULL, 'nacional',
  8000000, 150000,
  '2026-02-20', '2026-03-10', '2026-06-15',
  'https://www.gov.br/funarte/editais/artes-cenicas-circulacao-2026',
  'aberto', 'PJ',
  ARRAY['funarte', 'circulação', 'artes cênicas', 'teatro', 'dança', 'circo'],
  'funarte-cenicas-circulacao-2026'
),
(
  2, 'Edital Lei Paulo Gustavo — Audiovisual MG 2026',
  'Secretaria de Estado de Cultura e Turismo de MG',
  'Fomento a projetos audiovisuais de curta e longa-metragem, séries, documentários e animações produzidos em Minas Gerais.',
  (SELECT id FROM categorias WHERE slug='audiovisual'), 'MG', NULL, 'estadual',
  12000000, 300000,
  '2026-04-10', '2026-05-01', '2026-08-15',
  'https://www.cultura.mg.gov.br/editais/lpg-audiovisual-2026',
  'aberto', 'PF/PJ',
  ARRAY['paulo gustavo', 'audiovisual', 'cinema', 'minas gerais'],
  'mg-lpg-audiovisual-2026'
),
(
  2, 'Edital de Fomento às Artes — Minas Gerais 2026',
  'Secretaria de Estado de Cultura e Turismo de MG',
  'Apoio a projetos artísticos nas áreas de teatro, dança, circo, música e artes visuais com execução em Minas Gerais.',
  (SELECT id FROM categorias WHERE slug='multidisciplinar'), 'MG', NULL, 'estadual',
  6000000, 80000,
  '2026-05-01', '2026-05-20', '2026-09-30',
  'https://www.cultura.mg.gov.br/editais/fomento-artes-2026',
  'aberto', 'PF/PJ',
  ARRAY['fomento', 'artes', 'minas gerais', 'teatro', 'dança', 'circo', 'música'],
  'mg-fomento-artes-2026'
),
(
  5, 'Edital BH Cultura Viva — Pontos de Cultura 2026',
  'Fundação Municipal de Cultura de BH',
  'Reconhecimento e apoio financeiro a Pontos de Cultura na cidade de Belo Horizonte. Destinado a organizações culturais comunitárias com atuação comprovada de pelo menos 3 anos.',
  (SELECT id FROM categorias WHERE slug='cultura-popular'), 'MG', 'Belo Horizonte', 'municipal',
  3000000, 60000,
  '2026-03-01', '2026-03-20', '2026-06-30',
  'https://prefeitura.pbh.gov.br/fundacao-municipal-de-cultura/editais/cultura-viva-2026',
  'aberto', 'PJ',
  ARRAY['cultura viva', 'pontos de cultura', 'belo horizonte', 'comunitário'],
  'bh-cultura-viva-2026'
),
(
  3, 'ProAC Expresso — Artes Cênicas SP 2026',
  'Secretaria de Cultura e Economia Criativa de SP',
  'Apoio direto a artistas e grupos de artes cênicas do estado de São Paulo via ProAC Expresso.',
  (SELECT id FROM categorias WHERE slug='artes-cenicas'), 'SP', NULL, 'estadual',
  10000000, 50000,
  '2026-01-15', '2026-02-01', '2026-05-30',
  'https://www.cultura.sp.gov.br/proac-expresso-cenicas-2026',
  'encerrado', 'PF/PJ',
  ARRAY['proac', 'são paulo', 'artes cênicas', 'expresso'],
  'sp-proac-cenicas-2026'
),
(
  4, 'Edital de Circo — Lei Paulo Gustavo RJ 2026',
  'Secretaria de Estado de Cultura e Economia Criativa do RJ',
  'Fomento específico para projetos circenses: espetáculos, formação, pesquisa e memória do circo no Rio de Janeiro.',
  (SELECT id FROM categorias WHERE slug='circo'), 'RJ', NULL, 'estadual',
  4000000, 100000,
  '2026-04-20', '2026-05-10', '2026-08-30',
  'https://www.cultura.rj.gov.br/editais/lpg-circo-2026',
  'aberto', 'PF/PJ',
  ARRAY['circo', 'paulo gustavo', 'rio de janeiro', 'formação'],
  'rj-lpg-circo-2026'
),
(
  1, 'Prêmio Funarte de Dramaturgia 2025',
  'Funarte / Ministério da Cultura',
  'Premiação de textos dramatúrgicos inéditos em língua portuguesa.',
  (SELECT id FROM categorias WHERE slug='literatura'), NULL, NULL, 'nacional',
  500000, 25000,
  '2025-08-01', '2025-08-15', '2025-12-01',
  'https://www.gov.br/funarte/editais/dramaturgia-2025',
  'encerrado', 'PF',
  ARRAY['dramaturgia', 'teatro', 'literatura', 'prêmio'],
  'funarte-dramaturgia-2025'
),
(
  2, 'Edital Música nas Praças — BH 2026',
  'Fundação Municipal de Cultura de BH',
  'Seleção de artistas e bandas para apresentações musicais gratuitas em praças e espaços públicos de Belo Horizonte.',
  (SELECT id FROM categorias WHERE slug='musica'), 'MG', 'Belo Horizonte', 'municipal',
  800000, 5000,
  '2026-06-01', '2026-06-15', '2026-07-31',
  'https://prefeitura.pbh.gov.br/fundacao-municipal-de-cultura/editais/musica-pracas-2026',
  'aberto', 'PF/PJ',
  ARRAY['música', 'praças', 'belo horizonte', 'shows gratuitos'],
  'bh-musica-pracas-2026'
),
(
  1, 'Edital Funarte — Festivais de Dança 2026',
  'Funarte / Ministério da Cultura',
  'Apoio à realização de festivais de dança com programação nacional e/ou internacional.',
  (SELECT id FROM categorias WHERE slug='danca'), NULL, NULL, 'nacional',
  5000000, 250000,
  '2026-05-10', '2026-06-01', '2026-09-15',
  'https://www.gov.br/funarte/editais/festivais-danca-2026',
  'aberto', 'PJ',
  ARRAY['dança', 'festival', 'funarte'],
  'funarte-festivais-danca-2026'
);

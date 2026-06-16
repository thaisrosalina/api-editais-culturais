-- Padroniza status para formato da planilha (capitalizado)
UPDATE editais SET status = 'Aberto' WHERE status = 'aberto';
UPDATE editais SET status = 'Em breve' WHERE status = 'em_breve';
UPDATE editais SET status = 'Encerrado' WHERE status = 'encerrado';
UPDATE editais SET status = 'Suspenso' WHERE status = 'suspenso';
UPDATE editais SET status = 'Resultado publicado' WHERE status = 'resultado';

-- Marca como Encerrado editais com prazo vencido
UPDATE editais
SET status = 'Encerrado'
WHERE data_encerramento < CURRENT_DATE
  AND status IN ('Aberto', 'Em breve');

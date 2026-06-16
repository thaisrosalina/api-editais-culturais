-- Gera id_edital para editais que não têm
UPDATE editais
SET id_edital = CONCAT(
  COALESCE(uf, 'BR'), '-',
  EXTRACT(YEAR FROM COALESCE(data_coleta, criado_em))::text, '-',
  LPAD(id::text, 3, '0')
)
WHERE id_edital IS NULL;

-- Marca como Encerrado editais com data_encerramento passada que ainda estão como Aberto/Em breve
UPDATE editais
SET status = 'Encerrado'
WHERE data_encerramento IS NOT NULL
  AND data_encerramento < CURRENT_DATE
  AND status IN ('Aberto', 'Em breve');

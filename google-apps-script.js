/**
 * Google Apps Script — Sincroniza a planilha com a API de Editais Culturais
 *
 * COMO USAR:
 * 1. Abra a planilha no Google Sheets
 * 2. Menu: Extensões > Apps Script
 * 3. Cole este código inteiro
 * 4. Mude API_URL para o endereço da sua API (local ou deploy)
 * 5. Clique em Executar > sincronizarEditais
 * 6. (Opcional) Configure um gatilho para rodar diariamente
 */

const API_URL = 'https://api-editais-culturais.onrender.com'

const SHEET_NAME = 'Editais'

const HEADERS = [
  'ID_Edital', 'Nome_Edital', 'Órgão', 'Município/UF', 'Abrangência',
  'Modalidade', 'Status_Edital', 'Data_Lançamento', 'Início_Inscrição',
  'Fim_Inscrição', 'Dias_Restantes', 'Pode_PF', 'Pode_PJ',
  'Exige_Domicílio_Local', 'Qtd_Projetos_por_Proponente', 'Pontuação_Mínima',
  'Critério_Aprovação', 'Setores', 'Subsetores/Observações', 'Perfil_Alvo',
  'Teto_por_Projeto', 'Renúncia_Total_Estimada', 'Imposto_Incentivado',
  'Contrapartida_Obrigatória', 'Exige_Acessibilidade', 'Exige_Prestação_de_Contas',
  'Nível_de_Complexidade', 'Link_Edital', 'Link_DOM', 'Link_Inscrição',
  'Fonte_Encontrada', 'Data_da_Coleta', 'Responsável_Interno',
  'Prioridade', 'Go/No-Go', 'Motivo_Go_No-Go', 'Observações'
]

function sincronizarEditais() {
  const response = UrlFetchApp.fetch(API_URL + '/api/editais?limite=200')
  const data = JSON.parse(response.getContentText())
  const editais = data.dados

  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
  }

  // Legenda nas primeiras linhas (compatível com a planilha original)
  sheet.getRange(1, 1).setValue('LEGENDA')
  sheet.getRange(1, 4).setValue('Status: Aberto')
  sheet.getRange(1, 6).setValue('Em breve')
  sheet.getRange(1, 8).setValue('Encerrado')
  sheet.getRange(1, 10).setValue('Suspenso/Resultado')
  sheet.getRange(1, 13).setValue('Prioridade Alta')
  sheet.getRange(1, 15).setValue('Média')
  sheet.getRange(1, 17).setValue('Baixa')
  sheet.getRange(1, 20).setValue('Go')
  sheet.getRange(1, 22).setValue('Avaliar')
  sheet.getRange(1, 24).setValue('No-Go')
  sheet.getRange(1, 27).setValue('Prazo ≤7 dias')
  sheet.getRange(1, 29).setValue('8 a 15 dias')
  sheet.getRange(1, 31).setValue('>15 dias')
  sheet.getRange(1, 33).setValue('Prazo expirado')

  sheet.getRange(3, 1).setValue(
    'As cores são aplicadas automaticamente pelas regras de formatação condicional. Sincronizado via API.'
  )

  // Headers na linha 5
  const headerRow = 5
  sheet.getRange(headerRow, 1, 1, HEADERS.length).setValues([HEADERS])
  sheet.getRange(headerRow, 1, 1, HEADERS.length).setFontWeight('bold')

  // Dados a partir da linha 6
  const dataStartRow = 6

  // Limpa dados antigos
  const lastRow = sheet.getLastRow()
  if (lastRow >= dataStartRow) {
    sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, HEADERS.length).clear()
  }

  const rows = editais.map(function(e) {
    const municipioUf = [e.municipio, e.uf].filter(Boolean).join('/')
    return [
      e.id_edital || '',
      e.titulo || '',
      e.orgao || '',
      municipioUf,
      e.abrangencia || '',
      e.modalidade || '',
      e.status || '',
      formatarData(e.data_publicacao),
      formatarData(e.data_abertura),
      formatarData(e.data_encerramento),
      e.dias_restantes != null ? e.dias_restantes : '',
      e.pode_pf ? 'Sim' : 'Não',
      e.pode_pj ? 'Sim' : 'Não',
      e.exige_domicilio_local ? 'Sim' : 'Não',
      e.qtd_projetos_por_proponente || 'Não informado',
      e.pontuacao_minima || 'Não informado',
      e.criterio_aprovacao || 'Não informado',
      (e.setores || []).join('; '),
      e.subsetores_obs || '',
      e.perfil_alvo || '',
      e.teto_por_projeto ? formatarMoeda(e.teto_por_projeto) : 'Não informado',
      e.renuncia_total_estimada ? formatarMoeda(e.renuncia_total_estimada) : 'Não informado',
      e.imposto_incentivado || 'Não aplicável',
      e.contrapartida_obrigatoria ? 'Sim' : (e.contrapartida_obrigatoria === false ? 'Não' : 'Não informado'),
      e.exige_acessibilidade ? 'Sim' : (e.exige_acessibilidade === false ? 'Não' : 'Não informado'),
      e.exige_prestacao_contas ? 'Sim' : (e.exige_prestacao_contas === false ? 'Não' : 'Não informado'),
      e.nivel_complexidade || 'Não informado',
      e.link_edital || '',
      e.link_dom || 'Não informado',
      e.link_inscricao || 'Não informado',
      e.fonte_encontrada || '',
      formatarData(e.data_coleta),
      e.responsavel_interno || 'Não informado',
      e.prioridade || '',
      e.go_nogo || '',
      e.motivo_go_nogo || '',
      e.observacoes || ''
    ]
  })

  if (rows.length > 0) {
    sheet.getRange(dataStartRow, 1, rows.length, HEADERS.length).setValues(rows)
  }

  // Aplicar formatação condicional
  aplicarFormatacao(sheet, dataStartRow, rows.length)

  try {
    SpreadsheetApp.getUi().alert(
      'Sincronização concluída!\n\n' +
      rows.length + ' editais importados da API.\n' +
      'Última atualização: ' + new Date().toLocaleString('pt-BR')
    )
  } catch (e) {
    console.log('Sincronização concluída: ' + rows.length + ' editais importados.')
  }
}

function formatarData(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return dd + '/' + mm + '/' + d.getFullYear()
}

function formatarMoeda(valor) {
  const num = parseFloat(valor)
  if (isNaN(num)) return 'Não informado'
  return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function aplicarFormatacao(sheet, startRow, numRows) {
  if (numRows === 0) return
  const endRow = startRow + numRows - 1

  // Limpa regras anteriores
  sheet.clearConditionalFormatRules()
  const rules = []

  // Coluna G (7) = Status
  const statusRange = sheet.getRange(startRow, 7, numRows, 1)

  // Aberto = verde
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('aberto')
    .setBackground('#d9ead3')
    .setRanges([statusRange])
    .build())

  // Em breve = amarelo
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('em_breve')
    .setBackground('#fff2cc')
    .setRanges([statusRange])
    .build())

  // Encerrado = cinza
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('encerrado')
    .setBackground('#d9d9d9')
    .setRanges([statusRange])
    .build())

  // Coluna K (11) = Dias Restantes
  const diasRange = sheet.getRange(startRow, 11, numRows, 1)

  // ≤ 0 = vermelho (expirado)
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThanOrEqualTo(0)
    .setBackground('#f4c7c3')
    .setRanges([diasRange])
    .build())

  // 1-7 = laranja
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(1, 7)
    .setBackground('#fce5cd')
    .setRanges([diasRange])
    .build())

  // 8-15 = amarelo
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(8, 15)
    .setBackground('#fff2cc')
    .setRanges([diasRange])
    .build())

  // > 15 = verde
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(15)
    .setBackground('#d9ead3')
    .setRanges([diasRange])
    .build())

  // Coluna AH (34) = Prioridade
  const prioRange = sheet.getRange(startRow, 34, numRows, 1)

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Alta')
    .setBackground('#ea9999')
    .setRanges([prioRange])
    .build())

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Média')
    .setBackground('#ffe599')
    .setRanges([prioRange])
    .build())

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Baixa')
    .setBackground('#b6d7a8')
    .setRanges([prioRange])
    .build())

  // Coluna AI (35) = Go/No-Go
  const goRange = sheet.getRange(startRow, 35, numRows, 1)

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Go')
    .setBackground('#b6d7a8')
    .setRanges([goRange])
    .build())

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Avaliar')
    .setBackground('#ffe599')
    .setRanges([goRange])
    .build())

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('No-Go')
    .setBackground('#ea9999')
    .setRanges([goRange])
    .build())

  sheet.setConditionalFormatRules(rules)
}

/**
 * Adiciona menu customizado na planilha
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('API Editais')
    .addItem('Sincronizar editais', 'sincronizarEditais')
    .addItem('Configurar atualização diária', 'configurarGatilho')
    .addToUi()
}

/**
 * Configura gatilho para sincronizar diariamente às 7h
 */
function configurarGatilho() {
  // Remove gatilhos anteriores
  const triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'sincronizarEditais') {
      ScriptApp.deleteTrigger(t)
    }
  })

  ScriptApp.newTrigger('sincronizarEditais')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create()

  SpreadsheetApp.getUi().alert('Gatilho configurado! A planilha será atualizada diariamente às 7h.')
}

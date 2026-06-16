/**
 * Google Apps Script — Sincroniza a planilha com a API de Editais Culturais
 * Alimenta Editais (ativos) e Memoria (encerrados).
 * Resumo_Diario e abas por responsável já têm fórmulas próprias.
 */

var API_URL = 'https://api-editais-culturais.onrender.com'

var HEADERS = [
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
  var response = UrlFetchApp.fetch(API_URL + '/api/editais?limite=200')
  var data = JSON.parse(response.getContentText())
  var editais = data.dados

  var ss = SpreadsheetApp.getActiveSpreadsheet()

  var ativos = []
  var encerrados = []

  editais.forEach(function(e) {
    var row = montarLinha(e)
    if (e.status === 'Encerrado' || e.status === 'Resultado publicado') {
      encerrados.push(row)
    } else {
      ativos.push(row)
    }
  })

  preencherAba(ss, 'Editais', ativos)
  preencherAba(ss, 'Memoria', encerrados)

  console.log(
    'Sincronização concluída: ' + ativos.length + ' ativos, ' +
    encerrados.length + ' em Memoria.'
  )
}

function preencherAba(ss, nomeAba, rows) {
  var sheet = ss.getSheetByName(nomeAba)
  if (!sheet) {
    sheet = ss.insertSheet(nomeAba)
  }

  var headerRow = findHeaderRow(sheet)

  if (headerRow === -1) {
    headerRow = 1
    sheet.getRange(headerRow, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.getRange(headerRow, 1, 1, HEADERS.length).setFontWeight('bold')
  }

  var dataStartRow = headerRow + 1

  var lastRow = sheet.getLastRow()
  if (lastRow >= dataStartRow) {
    sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, HEADERS.length).clear()
  }

  if (rows.length > 0) {
    sheet.getRange(dataStartRow, 1, rows.length, HEADERS.length).setValues(rows)
  }

  aplicarFormatacao(sheet, dataStartRow, rows.length)
}

function findHeaderRow(sheet) {
  var lastRow = Math.min(sheet.getLastRow(), 10)
  if (lastRow === 0) return -1

  var data = sheet.getRange(1, 1, lastRow, 1).getValues()
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === 'ID_Edital') {
      return i + 1
    }
  }
  return -1
}

function montarLinha(e) {
  var municipioUf = [e.municipio, e.uf].filter(Boolean).join('/')
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
}

function formatarData(isoDate) {
  if (!isoDate) return ''
  var d = new Date(isoDate)
  if (isNaN(d.getTime())) return ''
  var dd = String(d.getDate()).padStart(2, '0')
  var mm = String(d.getMonth() + 1).padStart(2, '0')
  return dd + '/' + mm + '/' + d.getFullYear()
}

function formatarMoeda(valor) {
  var num = parseFloat(valor)
  if (isNaN(num)) return 'Não informado'
  return 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function aplicarFormatacao(sheet, startRow, numRows) {
  if (numRows === 0) return

  sheet.clearConditionalFormatRules()
  var rules = []

  var statusRange = sheet.getRange(startRow, 7, numRows, 1)
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Aberto').setBackground('#d9ead3').setRanges([statusRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Em breve').setBackground('#fff2cc').setRanges([statusRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Encerrado').setBackground('#d9d9d9').setRanges([statusRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Suspenso').setBackground('#d9d9d9').setRanges([statusRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Resultado publicado').setBackground('#c9daf8').setRanges([statusRange]).build())

  var diasRange = sheet.getRange(startRow, 11, numRows, 1)
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberLessThanOrEqualTo(0).setBackground('#f4c7c3').setRanges([diasRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(1, 7).setBackground('#fce5cd').setRanges([diasRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(8, 15).setBackground('#fff2cc').setRanges([diasRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(15).setBackground('#d9ead3').setRanges([diasRange]).build())

  var prioRange = sheet.getRange(startRow, 34, numRows, 1)
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Alta').setBackground('#ea9999').setRanges([prioRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Média').setBackground('#ffe599').setRanges([prioRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Baixa').setBackground('#b6d7a8').setRanges([prioRange]).build())

  var goRange = sheet.getRange(startRow, 35, numRows, 1)
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Go').setBackground('#b6d7a8').setRanges([goRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Avaliar').setBackground('#ffe599').setRanges([goRange]).build())
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('No-Go').setBackground('#ea9999').setRanges([goRange]).build())

  sheet.setConditionalFormatRules(rules)
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('API Editais')
    .addItem('Sincronizar editais', 'sincronizarEditais')
    .addItem('Configurar atualização diária', 'configurarGatilho')
    .addToUi()
}

function configurarGatilho() {
  var triggers = ScriptApp.getProjectTriggers()
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

  try {
    SpreadsheetApp.getUi().alert('Gatilho configurado! Atualização diária às 7h.')
  } catch (e) {
    console.log('Gatilho configurado para sincronização diária às 7h.')
  }
}

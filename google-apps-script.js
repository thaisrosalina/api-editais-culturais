/**
 * Google Apps Script — Sincroniza a planilha com a API de Editais Culturais
 * Merge inteligente: adiciona novos, complementa vazios, não sobrescreve edições manuais.
 * Resumo_Diario, Memoria e abas por responsável já têm fórmulas próprias.
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

var CAMPOS_MANUAIS = [
  'Responsável_Interno', 'Prioridade', 'Go/No-Go', 'Motivo_Go_No-Go', 'Observações'
]

function sincronizarEditais() {
  var response = UrlFetchApp.fetch(API_URL + '/api/editais?limite=200')
  var data = JSON.parse(response.getContentText())
  var editaisApi = data.dados

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName('Editais')
  if (!sheet) {
    sheet = ss.insertSheet('Editais')
  }

  var headerRow = findHeaderRow(sheet)
  if (headerRow === -1) {
    headerRow = 1
    sheet.getRange(headerRow, 1, 1, HEADERS.length).setValues([HEADERS])
    sheet.getRange(headerRow, 1, 1, HEADERS.length).setFontWeight('bold')
  }

  var dataStartRow = headerRow + 1
  var existentes = carregarExistentes(sheet, headerRow)

  var novos = 0
  var atualizados = 0
  var jaExistentes = 0

  editaisApi.forEach(function(e) {
    var row = montarLinha(e)
    var chave = encontrarChave(e, existentes)

    if (chave !== -1) {
      var mudou = mergeRow(sheet, chave, row, headerRow)
      if (mudou) {
        atualizados++
      } else {
        jaExistentes++
      }
    } else {
      var nextRow = sheet.getLastRow() + 1
      if (nextRow < dataStartRow) nextRow = dataStartRow
      sheet.getRange(nextRow, 1, 1, HEADERS.length).setValues([row])
      novos++
    }
  })

  atualizarDiasRestantes(sheet, headerRow)
  aplicarFormatacao(sheet, dataStartRow, sheet.getLastRow() - dataStartRow + 1)

  var resumo = 'Sincronização: ' + editaisApi.length + ' da API, ' +
    novos + ' novos, ' + atualizados + ' atualizados, ' + jaExistentes + ' sem alteração.'
  console.log(resumo)
}

function triggerColeta() {
  try {
    var options = { method: 'post', muteHttpExceptions: true }
    var response = UrlFetchApp.fetch(API_URL + '/api/coleta', options)
    var result = JSON.parse(response.getContentText())
    console.log('Coleta disparada: ' + JSON.stringify(result))
    Utilities.sleep(3000)
    sincronizarEditais()
  } catch (e) {
    console.log('Erro na coleta: ' + e.message)
    sincronizarEditais()
  }
}

function carregarExistentes(sheet, headerRow) {
  var lastRow = sheet.getLastRow()
  if (lastRow <= headerRow) return {}

  var numRows = lastRow - headerRow
  var data = sheet.getRange(headerRow + 1, 1, numRows, HEADERS.length).getValues()
  var map = {}

  for (var i = 0; i < data.length; i++) {
    var idEdital = String(data[i][0]).trim()
    var nomeEdital = String(data[i][1]).trim().toLowerCase()
    var linkEdital = String(data[i][27]).trim().toLowerCase()
    var rowNum = headerRow + 1 + i

    if (idEdital) map['id:' + idEdital] = rowNum
    if (nomeEdital) map['nome:' + nomeEdital] = rowNum
    if (linkEdital && linkEdital !== 'não informado' && linkEdital !== '') {
      map['link:' + linkEdital] = rowNum
    }
  }

  return map
}

function encontrarChave(edital, existentes) {
  var idEdital = String(edital.id_edital || '').trim()
  if (idEdital && existentes['id:' + idEdital]) return existentes['id:' + idEdital]

  var nome = String(edital.titulo || '').trim().toLowerCase()
  if (nome && existentes['nome:' + nome]) return existentes['nome:' + nome]

  var link = String(edital.link_edital || '').trim().toLowerCase()
  if (link && existentes['link:' + link]) return existentes['link:' + link]

  return -1
}

function mergeRow(sheet, rowNum, newData, headerRow) {
  var existing = sheet.getRange(rowNum, 1, 1, HEADERS.length).getValues()[0]
  var mudou = false

  for (var col = 0; col < HEADERS.length; col++) {
    var header = HEADERS[col]

    if (CAMPOS_MANUAIS.indexOf(header) !== -1) continue

    if (header === 'Dias_Restantes') continue

    var valorAtual = String(existing[col]).trim()
    var valorNovo = String(newData[col]).trim()

    if (valorNovo === '' || valorNovo === 'Não informado' || valorNovo === 'Não aplicável') continue

    var vazio = (valorAtual === '' || valorAtual === 'Não informado' || valorAtual === 'Não aplicável' || valorAtual === 'undefined')

    if (header === 'Status_Edital') {
      if (valorAtual !== valorNovo) {
        sheet.getRange(rowNum, col + 1).setValue(newData[col])
        mudou = true
      }
      continue
    }

    if (vazio) {
      sheet.getRange(rowNum, col + 1).setValue(newData[col])
      mudou = true
    }
  }

  return mudou
}

function atualizarDiasRestantes(sheet, headerRow) {
  var lastRow = sheet.getLastRow()
  if (lastRow <= headerRow) return

  var colFim = 10
  var colDias = 11
  var numRows = lastRow - headerRow

  var datas = sheet.getRange(headerRow + 1, colFim, numRows, 1).getValues()
  var hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  var valores = []
  for (var i = 0; i < datas.length; i++) {
    var val = String(datas[i][0]).trim()
    if (!val) {
      valores.push([''])
      continue
    }
    var parts = val.split('/')
    if (parts.length === 3) {
      var dataFim = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      var diff = Math.floor((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      valores.push([diff])
    } else {
      valores.push([''])
    }
  }

  sheet.getRange(headerRow + 1, colDias, numRows, 1).setValues(valores)
}

function findHeaderRow(sheet) {
  var lastRow = Math.min(sheet.getLastRow(), 10)
  if (lastRow === 0) return -1

  var data = sheet.getRange(1, 1, lastRow, 1).getValues()
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === 'ID_Edital') return i + 1
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
  if (numRows <= 0) return

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
    .addItem('Buscar novos + sincronizar', 'triggerColeta')
    .addItem('Configurar atualização diária', 'configurarGatilho')
    .addToUi()
}

function configurarGatilho() {
  var triggers = ScriptApp.getProjectTriggers()
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'triggerColeta') {
      ScriptApp.deleteTrigger(t)
    }
  })

  ScriptApp.newTrigger('triggerColeta')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create()

  try {
    SpreadsheetApp.getUi().alert('Gatilho configurado! Busca + sincronização diária às 7h.')
  } catch (e) {
    console.log('Gatilho configurado para busca + sincronização diária às 7h.')
  }
}

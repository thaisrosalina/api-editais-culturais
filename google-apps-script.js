/**
 * Google Apps Script — Sincroniza a planilha com a API de Editais Culturais
 * Segue o Guia de Uso: Editais, Memoria, abas por responsável, Resumo_Diario
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

var RESPONSAVEIS = ['Thais Oliveira', 'Isabela Cunha', 'Laís Oliveira']

function sincronizarEditais() {
  var response = UrlFetchApp.fetch(API_URL + '/api/editais?limite=200')
  var data = JSON.parse(response.getContentText())
  var editais = data.dados

  var ss = SpreadsheetApp.getActiveSpreadsheet()

  var ativos = []
  var encerrados = []
  var porResponsavel = {}

  RESPONSAVEIS.forEach(function(nome) { porResponsavel[nome] = [] })

  editais.forEach(function(e) {
    var row = montarLinha(e)

    if (e.status === 'Encerrado' || e.status === 'Resultado publicado') {
      encerrados.push(row)
    } else {
      ativos.push(row)
    }

    var resp = e.responsavel_interno || ''
    if (porResponsavel[resp] !== undefined) {
      porResponsavel[resp].push(row)
    }
  })

  preencherAba(ss, 'Editais', ativos, true)
  preencherAba(ss, 'Memoria', encerrados, false)

  RESPONSAVEIS.forEach(function(nome) {
    preencherAba(ss, nome, porResponsavel[nome], false)
  })

  preencherResumo(ss, editais, ativos, encerrados)

  console.log(
    'Sincronização concluída: ' + ativos.length + ' ativos, ' +
    encerrados.length + ' em Memoria, ' + editais.length + ' total.'
  )
}

function preencherAba(ss, nomeAba, rows, comLegenda) {
  var sheet = ss.getSheetByName(nomeAba)
  if (!sheet) {
    sheet = ss.insertSheet(nomeAba)
  }

  var headerRow = 1

  if (comLegenda) {
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
      'Sincronizado via API — ' + new Date().toLocaleString('pt-BR')
    )
    headerRow = 5
  }

  sheet.getRange(headerRow, 1, 1, HEADERS.length).setValues([HEADERS])
  sheet.getRange(headerRow, 1, 1, HEADERS.length).setFontWeight('bold')

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

function preencherResumo(ss, todos, ativos, encerrados) {
  var sheet = ss.getSheetByName('Resumo_Diario')
  if (!sheet) {
    sheet = ss.insertSheet('Resumo_Diario')
  }

  sheet.clear()

  var urgentes7 = []
  var urgentes15 = []
  var porPrioridade = { 'Alta': 0, 'Média': 0, 'Baixa': 0 }
  var porGo = { 'Go': 0, 'Avaliar': 0, 'No-Go': 0 }
  var porModalidade = {}
  var porUf = {}

  todos.forEach(function(e) {
    if (e.status !== 'Encerrado' && e.status !== 'Resultado publicado') {
      if (e.prioridade && porPrioridade[e.prioridade] !== undefined) {
        porPrioridade[e.prioridade]++
      }
      if (e.go_nogo && porGo[e.go_nogo] !== undefined) {
        porGo[e.go_nogo]++
      }
      if (e.dias_restantes != null && e.dias_restantes >= 0 && e.dias_restantes <= 7) {
        urgentes7.push(e)
      } else if (e.dias_restantes != null && e.dias_restantes > 7 && e.dias_restantes <= 15) {
        urgentes15.push(e)
      }
    }

    var mod = e.modalidade || 'Não informado'
    porModalidade[mod] = (porModalidade[mod] || 0) + 1

    var uf = e.uf || 'Nacional/Outro'
    porUf[uf] = (porUf[uf] || 0) + 1
  })

  var r = 1

  sheet.getRange(r, 1).setValue('RESUMO DIÁRIO — EDITAIS CULTURAIS')
  sheet.getRange(r, 1).setFontWeight('bold').setFontSize(14)
  r += 1
  sheet.getRange(r, 1).setValue('Atualizado em: ' + new Date().toLocaleString('pt-BR'))
  r += 2

  sheet.getRange(r, 1).setValue('▌ KPIs GERAIS')
  sheet.getRange(r, 1).setFontWeight('bold').setFontSize(12)
  r += 1

  var kpis = [
    ['Total de editais na base', todos.length],
    ['Editais ativos', ativos.length],
    ['Editais encerrados (Memoria)', encerrados.length],
    ['Prioridade Alta', porPrioridade['Alta']],
    ['Prioridade Média', porPrioridade['Média']],
    ['Prioridade Baixa', porPrioridade['Baixa']],
    ['Go', porGo['Go']],
    ['Avaliar', porGo['Avaliar']],
    ['No-Go', porGo['No-Go']],
    ['Prazo ≤ 7 dias', urgentes7.length],
    ['Prazo 8-15 dias', urgentes15.length]
  ]

  sheet.getRange(r, 1, kpis.length, 2).setValues(kpis)
  sheet.getRange(r, 1, kpis.length, 1).setFontWeight('bold')
  r += kpis.length + 2

  if (urgentes7.length > 0) {
    sheet.getRange(r, 1).setValue('▌ URGENTES — Prazo ≤ 7 dias')
    sheet.getRange(r, 1).setFontWeight('bold').setFontSize(12).setFontColor('#cc0000')
    r += 1

    var urgHeaders = ['ID', 'Nome', 'Dias Restantes', 'Prioridade', 'Go/No-Go', 'Responsável']
    sheet.getRange(r, 1, 1, urgHeaders.length).setValues([urgHeaders])
    sheet.getRange(r, 1, 1, urgHeaders.length).setFontWeight('bold')
    r += 1

    urgentes7.forEach(function(e) {
      sheet.getRange(r, 1, 1, 6).setValues([[
        e.id_edital || '', e.titulo || '', e.dias_restantes,
        e.prioridade || '', e.go_nogo || '', e.responsavel_interno || ''
      ]])
      sheet.getRange(r, 1, 1, 6).setBackground('#fce5cd')
      r += 1
    })
    r += 1
  }

  if (urgentes15.length > 0) {
    sheet.getRange(r, 1).setValue('▌ ATENÇÃO — Prazo 8 a 15 dias')
    sheet.getRange(r, 1).setFontWeight('bold').setFontSize(12).setFontColor('#b45f06')
    r += 1

    var attHeaders = ['ID', 'Nome', 'Dias Restantes', 'Prioridade', 'Go/No-Go', 'Responsável']
    sheet.getRange(r, 1, 1, attHeaders.length).setValues([attHeaders])
    sheet.getRange(r, 1, 1, attHeaders.length).setFontWeight('bold')
    r += 1

    urgentes15.forEach(function(e) {
      sheet.getRange(r, 1, 1, 6).setValues([[
        e.id_edital || '', e.titulo || '', e.dias_restantes,
        e.prioridade || '', e.go_nogo || '', e.responsavel_interno || ''
      ]])
      sheet.getRange(r, 1, 1, 6).setBackground('#fff2cc')
      r += 1
    })
    r += 1
  }

  sheet.getRange(r, 1).setValue('▌ POR MODALIDADE')
  sheet.getRange(r, 1).setFontWeight('bold').setFontSize(12)
  r += 1
  var modKeys = Object.keys(porModalidade).sort(function(a, b) { return porModalidade[b] - porModalidade[a] })
  modKeys.forEach(function(k) {
    sheet.getRange(r, 1, 1, 2).setValues([[k, porModalidade[k]]])
    r += 1
  })
  r += 1

  sheet.getRange(r, 1).setValue('▌ POR UF')
  sheet.getRange(r, 1).setFontWeight('bold').setFontSize(12)
  r += 1
  var ufKeys = Object.keys(porUf).sort(function(a, b) { return porUf[b] - porUf[a] })
  ufKeys.forEach(function(k) {
    sheet.getRange(r, 1, 1, 2).setValues([[k, porUf[k]]])
    r += 1
  })

  sheet.autoResizeColumns(1, 6)
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

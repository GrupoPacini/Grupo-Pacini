routerAdd(
  'POST',
  '/backend/v1/financial-reports/import',
  (e) => {
    var body = e.requestInfo().body || {}
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

    var userId = auth.id

    var userRole = auth.getString('role')
    if (userRole !== 'admin') {
      var profileId = auth.getString('access_profile')
      if (profileId) {
        try {
          var profile = $app.findRecordById('access_profiles', profileId)
          if (profile && profile.getString('status') === 'active') {
            var permsRaw = profile.get('permissions')
            var perms = permsRaw
            if (typeof perms === 'string') {
              try {
                perms = JSON.parse(perms)
              } catch (_) {}
            }
            if (perms && typeof perms === 'object') {
              var modulePerms = perms['Relatório Financeiro']
              if (!Array.isArray(modulePerms) || modulePerms.indexOf('importar') === -1) {
                return e.forbiddenError('Permissão negada para importar relatórios financeiros')
              }
              if (body.replace && modulePerms.indexOf('substituir') === -1) {
                return e.forbiddenError('Permissão negada para substituir relatórios financeiros')
              }
            }
          }
        } catch (_) {}
      }
    }

    var clientId = body.client || ''
    var month = parseInt(body.month, 10)
    var year = parseInt(body.year, 10)
    var notes = body.notes || ''
    var replace = body.replace || false
    var fileData = body.fileData || ''
    var fileName = body.fileName || ''
    var fileType = (body.fileType || '').toLowerCase()

    var openingBalanceRaw = body.openingBalance
    var openingBalance = null
    if (openingBalanceRaw !== undefined && openingBalanceRaw !== null && openingBalanceRaw !== '') {
      openingBalance = parseFloat(openingBalanceRaw)
      if (isNaN(openingBalance)) openingBalance = null
    }

    if (!clientId) return e.badRequestError('Cliente é obrigatório')
    if (!month || month < 1 || month > 12) return e.badRequestError('Mês inválido')
    if (!year || year < 2000 || year > 2100) return e.badRequestError('Ano inválido')
    if (!fileData) return e.badRequestError('Arquivo é obrigatório')

    var allowedExts = ['.csv', '.xls', '.xlsx', '.txt', '.tsv']
    var isAllowed = false
    for (var a = 0; a < allowedExts.length; a++) {
      if (fileType === allowedExts[a] || fileName.toLowerCase().endsWith(allowedExts[a])) {
        isAllowed = true
        break
      }
    }
    if (!isAllowed) {
      return e.badRequestError('Formato de arquivo inválido. Use .csv, .xls ou .xlsx')
    }

    var existingImport = null
    try {
      existingImport = $app.findFirstRecordByFilter(
        'financial_report_imports',
        'client = "' +
          clientId +
          '" && month = ' +
          month +
          ' && year = ' +
          year +
          ' && status = "importacao_concluida"',
      )
    } catch (_) {}

    if (existingImport && !replace) {
      return e.json(409, {
        error: 'duplicate',
        message: 'Já existe um relatório financeiro importado para este cliente neste mês.',
      })
    }

    var preservedOpeningBalance = null
    if (existingImport && replace) {
      try {
        preservedOpeningBalance = existingImport.get('opening_balance')
      } catch (_) {}
      try {
        var oldTxList = $app.findRecordsByFilter(
          'financial_transactions',
          'financial_report_import = "' + existingImport.id + '"',
          '',
          5000,
          0,
        )
        for (var o = 0; o < oldTxList.length; o++) {
          $app.delete(oldTxList[o])
        }
      } catch (_) {}
      try {
        $app.delete(existingImport)
      } catch (_) {}
    }

    var importsCol = $app.findCollectionByNameOrId('financial_report_imports')
    var importRecord = new Record(importsCol)
    importRecord.set('client', clientId)
    importRecord.set('month', month)
    importRecord.set('year', year)
    importRecord.set('file_name', fileName)
    importRecord.set('file_type', fileType || '.csv')
    importRecord.set('status', 'importando')
    importRecord.set('imported_by', userId)
    importRecord.set('imported_at', new Date().toISOString())
    importRecord.set('notes', notes)
    importRecord.set('record_count', 0)
    if (openingBalance !== null) {
      importRecord.set('opening_balance', openingBalance)
    } else if (preservedOpeningBalance !== null && preservedOpeningBalance !== undefined) {
      importRecord.set('opening_balance', preservedOpeningBalance)
    }
    $app.save(importRecord)

    var rows = []
    var text = fileData
    if (text.charCodeAt(0) === 65279) text = text.substring(1)

    if (text.indexOf('<table') >= 0 || text.indexOf('<tr') >= 0) {
      var trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
      var tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
      var trMatch
      while ((trMatch = trRegex.exec(text)) !== null) {
        var rowCells = []
        var trContent = trMatch[1]
        var tdMatch
        while ((tdMatch = tdRegex.exec(trContent)) !== null) {
          var cellText = tdMatch[1].replace(/<[^>]+>/g, '').trim()
          rowCells.push(cellText)
        }
        if (rowCells.length > 0) rows.push(rowCells)
      }
    } else {
      var firstLineEnd = text.indexOf('\n')
      var firstLine = firstLineEnd >= 0 ? text.substring(0, firstLineEnd) : text
      var delimiter = ','
      if (firstLine.split('\t').length > firstLine.split(',').length) delimiter = '\t'
      else if (firstLine.split(';').length > firstLine.split(',').length) delimiter = ';'

      var currentRow = []
      var currentField = ''
      var inQuotes = false

      for (var i = 0; i < text.length; i++) {
        var c = text[i]
        if (inQuotes) {
          if (c === '"') {
            if (text[i + 1] === '"') {
              currentField += '"'
              i++
            } else {
              inQuotes = false
            }
          } else {
            currentField += c
          }
        } else {
          if (c === '"') {
            inQuotes = true
          } else if (c === delimiter) {
            currentRow.push(currentField)
            currentField = ''
          } else if (c === '\n') {
            currentRow.push(currentField)
            currentField = ''
            rows.push(currentRow)
            currentRow = []
          } else if (c !== '\r') {
            currentField += c
          }
        }
      }
      if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField)
        rows.push(currentRow)
      }
    }

    if (!rows || rows.length < 2) {
      importRecord.set('status', 'arquivo_invalido')
      $app.save(importRecord)
      return e.json(400, {
        error: 'empty_file',
        message: 'O arquivo não contém dados válidos para importar.',
      })
    }

    var headers = rows[0]
    function findCol(names) {
      for (var i = 0; i < headers.length; i++) {
        var h = String(headers[i] || '')
          .toLowerCase()
          .trim()
        for (var j = 0; j < names.length; j++) {
          if (h === names[j] || h.indexOf(names[j]) >= 0) return i
        }
      }
      return -1
    }

    var dateIdx = findCol(['data', 'date', 'dt_transacao', 'dt', 'data_lancamento'])
    var descIdx = findCol([
      'descricao',
      'descrição',
      'description',
      'historico',
      'histórico',
      'detalhe',
      'memo',
      'lancamento',
      'lançamento',
    ])
    var catIdx = findCol(['categoria', 'category', 'grupo', 'classificacao', 'classificação'])
    var accIdx = findCol(['conta', 'account', 'banco', 'caixa'])
    var projIdx = findCol(['projeto', 'project', 'centro_custo', 'centro de custo'])
    var typeIdx = findCol(['tipo', 'type', 'natureza', 'operacao', 'operação', 'e/s'])
    var valIdx = findCol(['valor', 'value', 'montante', 'quantia', 'val'])
    var creditIdx = findCol(['credito', 'crédito', 'entrada', 'receita'])
    var debitIdx = findCol(['debito', 'débito', 'saida', 'saída', 'despesa'])
    var statIdx = findCol(['status', 'situação', 'situacao', 'estado'])

    var hasVal = valIdx !== -1 || creditIdx !== -1 || debitIdx !== -1
    if (dateIdx === -1 || descIdx === -1 || !hasVal) {
      importRecord.set('status', 'arquivo_invalido')
      $app.save(importRecord)
      return e.json(400, {
        error: 'missing_columns',
        message:
          'Colunas obrigatórias não encontradas. Certifique-se de que o arquivo contém Data, Descrição e Valor (ou Crédito/Débito).',
      })
    }

    function parseDate(val) {
      if (!val && val !== 0) return ''
      var s = String(val).trim()
      var br = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
      if (br) return br[3] + '-' + br[2].padStart(2, '0') + '-' + br[1].padStart(2, '0')
      var iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
      if (iso) return iso[1] + '-' + iso[2].padStart(2, '0') + '-' + iso[3].padStart(2, '0')
      var pd = new Date(s)
      if (!isNaN(pd.getTime())) return pd.toISOString().split('T')[0]
      return ''
    }

    function parseValue(val) {
      if (typeof val === 'number') return val
      if (!val) return 0
      var s = String(val).trim().replace(/R\$/gi, '').replace(/\s/g, '').trim()
      var isNeg = false
      if (s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'))) {
        isNeg = true
        s = s.replace(/[\(\)\-]/g, '')
      }
      var num = 0
      if (s.indexOf('.') >= 0 && s.indexOf(',') >= 0) {
        num = parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
      } else if (s.indexOf(',') >= 0) {
        num = parseFloat(s.replace(',', '.')) || 0
      } else {
        num = parseFloat(s) || 0
      }
      return isNeg ? -Math.abs(num) : num
    }

    function normStatus(val) {
      var s = String(val || '')
        .toLowerCase()
        .trim()
      if (['pago', 'paid', 'ok', 'confirmado', 'conciliado', 'liquidado'].indexOf(s) >= 0)
        return 'Pago'
      if (['pendente', 'pending', 'a pagar', 'a receber'].indexOf(s) >= 0) return 'Pendente'
      if (['atrasado', 'late', 'overdue', 'vencido'].indexOf(s) >= 0) return 'Atrasado'
      return 'Pago'
    }

    var ftCol = $app.findCollectionByNameOrId('financial_transactions')
    var count = 0

    for (var r = 1; r < rows.length; r++) {
      var row = rows[r]
      if (!row || row.length === 0) continue

      var dateVal = parseDate(row[dateIdx])
      var descVal = String(row[descIdx] || '').trim()

      var rawValue = 0
      var typeVal = 'Receita'

      if (valIdx !== -1) {
        rawValue = parseValue(row[valIdx])
        if (typeIdx !== -1) {
          var tStr = String(row[typeIdx] || '')
            .toLowerCase()
            .trim()
          if (
            [
              'despesa',
              'd',
              'saida',
              'saída',
              'debito',
              'débito',
              'debit',
              'expense',
              'pagamento',
            ].indexOf(tStr) >= 0
          ) {
            typeVal = 'Despesa'
          } else {
            typeVal = 'Receita'
          }
        } else {
          if (rawValue < 0) {
            typeVal = 'Despesa'
            rawValue = Math.abs(rawValue)
          } else {
            typeVal = 'Receita'
          }
        }
      } else {
        var creditVal = creditIdx !== -1 ? parseValue(row[creditIdx]) : 0
        var debitVal = debitIdx !== -1 ? parseValue(row[debitIdx]) : 0
        if (Math.abs(debitVal) > 0) {
          typeVal = 'Despesa'
          rawValue = Math.abs(debitVal)
        } else {
          typeVal = 'Receita'
          rawValue = Math.abs(creditVal)
        }
      }

      if (!dateVal && !descVal && rawValue === 0) continue

      var rec = new Record(ftCol)
      rec.set('client', clientId)
      rec.set('date', dateVal || year + '-' + String(month).padStart(2, '0') + '-01')
      rec.set('description', descVal)
      rec.set('category', catIdx >= 0 ? String(row[catIdx] || '').trim() : '')
      rec.set('account', accIdx >= 0 ? String(row[accIdx] || '').trim() : '')
      rec.set('project', projIdx >= 0 ? String(row[projIdx] || '').trim() : '')
      rec.set('type', typeVal)
      rec.set('value', Math.abs(rawValue))
      rec.set('status', statIdx >= 0 ? normStatus(row[statIdx]) : 'Pago')
      rec.set('financial_report_import', importRecord.id)

      try {
        $app.save(rec)
        count++
      } catch (err) {}
    }

    importRecord.set('status', 'importacao_concluida')
    importRecord.set('record_count', count)
    importRecord.set('imported_at', new Date().toISOString())
    $app.save(importRecord)

    return e.json(200, { success: true, id: importRecord.id, record_count: count })
  },
  $apis.requireAuth(),
)

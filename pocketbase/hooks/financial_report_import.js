// @deps xlsx@0.18.5
routerAdd(
  'POST',
  '/backend/v1/financial-reports/import',
  (e) => {
    var body = e.requestInfo().body || {}
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

    var userId = auth.id

    if (auth.getString('role') !== 'admin') {
      var profileId = auth.getString('access_profile')
      if (!profileId) return e.forbiddenError('Perfil de acesso não vinculado')
      var profile
      try {
        profile = $app.findRecordById('access_profiles', profileId)
      } catch (err) {
        return e.forbiddenError('Perfil de acesso não encontrado')
      }
      if (profile.getString('status') !== 'active')
        return e.forbiddenError('Perfil de acesso inativo')
      var permsRaw = profile.get('permissions')
      if (!permsRaw) return e.forbiddenError('Sem permissões configuradas')
      var perms = permsRaw
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms)
        } catch (_) {
          return e.forbiddenError('Permissões inválidas')
        }
      }
      var modulePerms = perms['Relatório Financeiro']
      if (!Array.isArray(modulePerms) || modulePerms.indexOf('importar') === -1) {
        return e.forbiddenError('Permissão negada para importar relatórios financeiros')
      }
      if (body.replace && modulePerms.indexOf('substituir') === -1) {
        return e.forbiddenError('Permissão negada para substituir relatórios financeiros')
      }
    }

    var clientId = body.client || ''
    var month = parseInt(body.month, 10)
    var year = parseInt(body.year, 10)
    var notes = body.notes || ''
    var replace = body.replace || false
    var fileData = body.fileData || ''
    var fileName = body.fileName || ''
    var fileType = body.fileType || ''

    if (!clientId) return e.badRequestError('Cliente é obrigatório')
    if (!month || month < 1 || month > 12) return e.badRequestError('Mês inválido')
    if (!year || year < 2000 || year > 2100) return e.badRequestError('Ano inválido')
    if (!fileData) return e.badRequestError('Arquivo é obrigatório')

    var validExtensions = ['.xlsx', '.xls', '.csv']
    if (validExtensions.indexOf(fileType) === -1) {
      return e.badRequestError('Formato de arquivo inválido. Use .xlsx, .xls ou .csv')
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

    if (existingImport && replace) {
      $app.delete(existingImport)
    }

    var importsCol = $app.findCollectionByNameOrId('financial_report_imports')
    var importRecord = new Record(importsCol)
    importRecord.set('client', clientId)
    importRecord.set('month', month)
    importRecord.set('year', year)
    importRecord.set('file_name', fileName)
    importRecord.set('file_type', fileType)
    importRecord.set('status', 'importando')
    importRecord.set('imported_by', userId)
    importRecord.set('imported_at', new Date().toISOString())
    importRecord.set('notes', notes)
    importRecord.set('record_count', 0)
    $app.save(importRecord)

    var XLSX = require('xlsx')
    var workbook, rows
    try {
      workbook = XLSX.read(fileData, { type: 'base64' })
      var sheetName = workbook.SheetNames[0]
      var sheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    } catch (parseErr) {
      importRecord.set('status', 'erro_importacao')
      $app.save(importRecord)
      return e.json(400, {
        error: 'parse_error',
        message: 'Não foi possível ler o arquivo. Verifique o formato.',
      })
    }

    if (!rows || rows.length < 2) {
      importRecord.set('status', 'arquivo_invalido')
      $app.save(importRecord)
      return e.json(400, {
        error: 'empty_file',
        message: 'O arquivo não contém dados para importar.',
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

    var dateIdx = findCol(['data', 'date'])
    var descIdx = findCol(['descricao', 'descrição', 'description', 'historico', 'histórico'])
    var catIdx = findCol(['categoria', 'category'])
    var accIdx = findCol(['conta', 'account'])
    var projIdx = findCol(['projeto', 'project'])
    var typeIdx = findCol(['tipo', 'type', 'natureza'])
    var valIdx = findCol(['valor', 'value', 'montante'])
    var statIdx = findCol(['status', 'situação', 'situacao'])

    if (dateIdx === -1 || descIdx === -1 || typeIdx === -1 || valIdx === -1) {
      importRecord.set('status', 'arquivo_invalido')
      $app.save(importRecord)
      return e.json(400, {
        error: 'missing_columns',
        message: 'Colunas obrigatórias não encontradas: Data, Descrição, Tipo, Valor.',
      })
    }

    function parseDate(val) {
      if (!val && val !== 0) return ''
      if (typeof val === 'number') {
        var d = new Date((val - 25569) * 86400 * 1000)
        return d.toISOString().split('T')[0]
      }
      var s = String(val).trim()
      var br = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
      if (br) return br[3] + '-' + br[2].padStart(2, '0') + '-' + br[1].padStart(2, '0')
      var iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
      if (iso) return iso[1] + '-' + iso[2].padStart(2, '0') + '-' + iso[3].padStart(2, '0')
      var pd = new Date(s)
      if (!isNaN(pd)) return pd.toISOString().split('T')[0]
      return s
    }

    function parseValue(val) {
      if (typeof val === 'number') return val
      if (!val) return 0
      var s = String(val).trim().replace(/R\$/i, '').trim()
      if (s.indexOf('.') >= 0 && s.indexOf(',') >= 0)
        return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
      if (s.indexOf(',') >= 0) return parseFloat(s.replace(',', '.')) || 0
      return parseFloat(s) || 0
    }

    function normType(val) {
      var s = String(val || '')
        .toLowerCase()
        .trim()
      if (['receita', 'r', 'entrada', 'credito', 'crédito', 'credit'].indexOf(s) >= 0)
        return 'Receita'
      if (
        ['despesa', 'd', 'saida', 'saída', 'debito', 'débito', 'debit', 'expense'].indexOf(s) >= 0
      )
        return 'Despesa'
      return 'Receita'
    }

    function normStatus(val) {
      var s = String(val || '')
        .toLowerCase()
        .trim()
      if (['pago', 'paid', 'ok', 'confirmado', 'conciliado'].indexOf(s) >= 0) return 'Pago'
      if (['pendente', 'pending', 'a pagar'].indexOf(s) >= 0) return 'Pendente'
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
      var typeVal = normType(row[typeIdx])
      var valueVal = parseValue(row[valIdx])
      if (!dateVal && !descVal && valueVal === 0) continue

      var rec = new Record(ftCol)
      rec.set('client', clientId)
      rec.set('date', dateVal || year + '-' + String(month).padStart(2, '0') + '-01')
      rec.set('description', descVal)
      rec.set('category', catIdx >= 0 ? String(row[catIdx] || '') : '')
      rec.set('account', accIdx >= 0 ? String(row[accIdx] || '') : '')
      rec.set('project', projIdx >= 0 ? String(row[projIdx] || '') : '')
      rec.set('type', typeVal)
      rec.set('value', valueVal)
      rec.set('status', statIdx >= 0 ? normStatus(row[statIdx]) : 'Pago')
      rec.set('financial_report_import', importRecord.id)
      $app.save(rec)
      count++
    }

    importRecord.set('status', 'importacao_concluida')
    importRecord.set('record_count', count)
    importRecord.set('imported_at', new Date().toISOString())
    $app.save(importRecord)

    return e.json(200, { success: true, id: importRecord.id, record_count: count })
  },
  $apis.requireAuth(),
)

routerAdd(
  'PATCH',
  '/backend/v1/financial-reports/{id}/opening-balance',
  (e) => {
    var id = e.request.pathValue('id')
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

    var userRole = auth.getString('role')
    if (userRole === 'Cliente') {
      return e.forbiddenError('Clientes não têm permissão para editar relatórios financeiros.')
    }
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
              if (!Array.isArray(modulePerms) || modulePerms.indexOf('editar') === -1) {
                return e.forbiddenError('Permissão negada para editar relatórios financeiros')
              }
            }
          }
        } catch (_) {}
      }
    }

    var body = e.requestInfo().body || {}
    var openingBalanceRaw = body.openingBalance
    var openingBalance = null

    if (openingBalanceRaw !== undefined && openingBalanceRaw !== null && openingBalanceRaw !== '') {
      openingBalance = parseFloat(openingBalanceRaw)
      if (isNaN(openingBalance)) {
        return e.badRequestError('Valor de saldo inicial inválido')
      }
    } else {
      return e.badRequestError('Saldo inicial é obrigatório')
    }

    try {
      var importRecord = $app.findRecordById('financial_report_imports', id)
      importRecord.set('opening_balance', openingBalance)
      $app.save(importRecord)
      return e.json(200, { success: true, id: id, opening_balance: openingBalance })
    } catch (err) {
      return e.notFoundError('Relatório financeiro não encontrado')
    }
  },
  $apis.requireAuth(),
)

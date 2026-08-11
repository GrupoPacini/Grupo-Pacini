routerAdd(
  'PATCH',
  '/backend/v1/financial-reports/{id}/opening-balance',
  (e) => {
    var id = e.request.pathValue('id')
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      return e.forbiddenError('Perfil de acesso não vinculado')
    }
    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      return e.forbiddenError('Perfil de acesso não encontrado')
    }
    var profileName = profile.getString('name')
    if (profileName === 'Cliente') {
      return e.forbiddenError('Clientes não têm permissão para editar relatórios financeiros.')
    }
    if (profile.getString('status') !== 'active') {
      return e.forbiddenError('Perfil de acesso inativo')
    }
    if (profileName !== 'Administrador') {
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
      } else {
        return e.forbiddenError('Permissão negada para editar relatórios financeiros')
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

routerAdd(
  'DELETE',
  '/backend/v1/financial-reports/{id}',
  (e) => {
    var id = e.request.pathValue('id')
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

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
              if (!Array.isArray(modulePerms) || modulePerms.indexOf('excluir') === -1) {
                return e.forbiddenError('Permissão negada para excluir relatórios financeiros')
              }
            }
          }
        } catch (_) {}
      }
    }

    try {
      var txList = $app.findRecordsByFilter(
        'financial_transactions',
        'financial_report_import = "' + id + '"',
        '',
        5000,
        0,
      )
      for (var i = 0; i < txList.length; i++) {
        $app.delete(txList[i])
      }
    } catch (_) {}

    try {
      var importRecord = $app.findRecordById('financial_report_imports', id)
      $app.delete(importRecord)
    } catch (err) {
      return e.notFoundError('Relatório financeiro não encontrado')
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)

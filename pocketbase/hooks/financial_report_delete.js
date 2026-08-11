routerAdd(
  'DELETE',
  '/backend/v1/financial-reports/{id}',
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
      return e.forbiddenError('Clientes não têm permissão para excluir relatórios financeiros.')
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
        if (!Array.isArray(modulePerms) || modulePerms.indexOf('excluir') === -1) {
          return e.forbiddenError('Permissão negada para excluir relatórios financeiros')
        }
      } else {
        return e.forbiddenError('Permissão negada para excluir relatórios financeiros')
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

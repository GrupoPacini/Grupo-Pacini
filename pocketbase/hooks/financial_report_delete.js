routerAdd(
  'DELETE',
  '/backend/v1/financial-reports/{id}',
  (e) => {
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

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
      if (!Array.isArray(modulePerms) || modulePerms.indexOf('excluir') === -1) {
        return e.forbiddenError('Permissão negada para excluir relatórios financeiros')
      }
    }

    var importId = e.request.pathValue('id')
    if (!importId) return e.badRequestError('ID do relatório é obrigatório')

    var importRecord
    try {
      importRecord = $app.findRecordById('financial_report_imports', importId)
    } catch (err) {
      return e.notFoundError('Relatório não encontrado')
    }

    var recordCount = importRecord.getInt('record_count')
    $app.delete(importRecord)

    return e.json(200, { success: true, deletedRecords: recordCount })
  },
  $apis.requireAuth(),
)

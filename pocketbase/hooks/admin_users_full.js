routerAdd(
  'GET',
  '/backend/v1/admin/users-full',
  (e) => {
    var auth = e.auth
    if (!auth) return e.unauthorizedError('Autenticação necessária')

    // Only Administrador profile (or superuser) may list users with email
    if (!auth.isSuperuser()) {
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
      if (profile.getString('status') !== 'active') {
        return e.forbiddenError('Perfil de acesso inativo')
      }
      if (profile.getString('name') !== 'Administrador') {
        return e.forbiddenError('Acesso restrito a administradores')
      }
    }

    try {
      var users = $app.findRecordsByFilter('users', '', 'name', 10000, 0)
    } catch (err) {
      return e.json(500, { error: 'Falha ao listar usuários' })
    }

    // Preload related records for expand (department, access_profile, client)
    var expandFields = ['department', 'access_profile', 'client']
    var result = []

    for (var i = 0; i < users.length; i++) {
      var u = users[i]
      // Force email to be exported regardless of emailVisibility
      u.ignoreEmailVisibility(true)

      var obj = u.publicExport()

      // Build expand object mirroring SDK expand behavior
      var expandObj = {}
      var hasExpand = false
      for (var j = 0; j < expandFields.length; j++) {
        var field = expandFields[j]
        var relId = u.getString(field)
        if (!relId) continue
        var relCollection =
          field === 'department'
            ? 'departments'
            : field === 'access_profile'
              ? 'access_profiles'
              : 'clients'
        try {
          var relRecord = $app.findRecordById(relCollection, relId)
          if (relRecord) {
            expandObj[field] = relRecord.publicExport()
            hasExpand = true
          }
        } catch (_) {
          // related record missing — skip
        }
      }
      if (hasExpand) {
        obj.expand = expandObj
      }

      result.push(obj)
    }

    return e.json(200, result)
  },
  $apis.requireAuth(),
)

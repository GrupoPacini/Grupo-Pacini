onRecordCreateRequest((e) => {
  function normalizePerms(raw) {
    if (!raw) return {}
    if (typeof raw === 'string') {
      if (raw.trim() === '') return {}
      try {
        var parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
        return null
      } catch (err) {
        return null
      }
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw
    return null
  }

  function hasAnyPerm(perms) {
    if (!perms) return false
    var keys = Object.keys(perms)
    for (var i = 0; i < keys.length; i++) {
      var arr = perms[keys[i]]
      if (Array.isArray(arr) && arr.length > 0) return true
    }
    return false
  }

  function hasClienteFinPerm(perms) {
    if (!perms) return false
    var fin = perms['Relatório Financeiro']
    return Array.isArray(fin) && fin.indexOf('visualizar') !== -1
  }

  var profileId = e.record.getString('access_profile')

  if (!profileId) {
    try {
      var defaultProfile = $app.findFirstRecordByData('access_profiles', 'name', 'Colaborador')
      e.record.set('access_profile', defaultProfile.id)
      profileId = defaultProfile.id
    } catch (err) {
      throw new BadRequestError(
        'Nenhum perfil de acesso selecionado e o perfil padrão não foi encontrado.',
      )
    }
  }

  var profile
  try {
    profile = $app.findRecordById('access_profiles', profileId)
  } catch (err) {
    throw new BadRequestError('Perfil de acesso não encontrado.')
  }

  if (profile.getString('status') !== 'active') {
    throw new BadRequestError('Não é possível vincular a um perfil inativo.')
  }

  var profileName = profile.getString('name')

  if (profileName === 'Cliente') {
    var clientId = e.record.getString('client')
    if (!clientId) {
      throw new BadRequestError('Selecione a empresa vinculada ao usuário.')
    }
    try {
      $app.findRecordById('clients', clientId)
    } catch (err) {
      throw new BadRequestError('Empresa vinculada não encontrada.')
    }
    e.record.set('department', '')
  } else {
    e.record.set('client', '')
  }

  e.record.set('profile_name', profileName)

  if (e.record.getString('status') === 'Ativo') {
    var permsRaw = profile.get('permissions')
    var perms = normalizePerms(permsRaw)
    if (perms === null) {
      throw new BadRequestError('Formato de permissões inválido no perfil de acesso.')
    }

    var hasPerm = false
    if (profileName === 'Cliente') {
      hasPerm = hasClienteFinPerm(perms)
    } else {
      hasPerm = hasAnyPerm(perms)
    }

    if (!hasPerm) {
      if (profileName === 'Cliente') {
        throw new BadRequestError(
          'O Perfil Cliente não possui a permissão "Relatório Financeiro - visualizar". Acesse Perfis de Acesso > Cliente > Configurar Permissões antes de criar o usuário.',
        )
      }
      throw new BadRequestError(
        'O perfil de acesso selecionado não possui permissões configuradas. Configure as permissões antes de vincular a um usuário ativo.',
      )
    }
  }

  e.next()
}, 'users')

onRecordUpdateRequest((e) => {
  function normalizePerms(raw) {
    if (!raw) return {}
    if (typeof raw === 'string') {
      if (raw.trim() === '') return {}
      try {
        var parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
        return null
      } catch (err) {
        return null
      }
    }
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw
    return null
  }

  function hasAnyPerm(perms) {
    if (!perms) return false
    var keys = Object.keys(perms)
    for (var i = 0; i < keys.length; i++) {
      var arr = perms[keys[i]]
      if (Array.isArray(arr) && arr.length > 0) return true
    }
    return false
  }

  function hasClienteFinPerm(perms) {
    if (!perms) return false
    var fin = perms['Relatório Financeiro']
    return Array.isArray(fin) && fin.indexOf('visualizar') !== -1
  }

  var newProfileId = e.record.getString('access_profile')
  var oldProfileId = e.record.original().getString('access_profile')

  if (!newProfileId) {
    try {
      var defaultProfile = $app.findFirstRecordByData('access_profiles', 'name', 'Colaborador')
      e.record.set('access_profile', defaultProfile.id)
      newProfileId = defaultProfile.id
    } catch (err) {
      throw new BadRequestError(
        'Nenhum perfil de acesso selecionado e o perfil padrão não foi encontrado.',
      )
    }
  }

  var newProfile
  try {
    newProfile = $app.findRecordById('access_profiles', newProfileId)
  } catch (err) {
    throw new BadRequestError('Perfil de acesso não encontrado.')
  }

  if (newProfile.getString('status') !== 'active') {
    throw new BadRequestError('Não é possível vincular a um perfil inativo.')
  }

  var newProfileName = newProfile.getString('name')

  if (newProfileName === 'Cliente') {
    var clientId = e.record.getString('client')
    if (!clientId) {
      throw new BadRequestError('Selecione a empresa vinculada ao usuário.')
    }
    try {
      $app.findRecordById('clients', clientId)
    } catch (err) {
      throw new BadRequestError('Empresa vinculada não encontrada.')
    }
    e.record.set('department', '')
  } else {
    var oldProfile = null
    try {
      oldProfile = $app.findRecordById('access_profiles', oldProfileId)
    } catch (_) {}
    if (oldProfile && oldProfile.getString('name') === 'Cliente') {
      e.record.set('client', '')
    }
  }

  e.record.set('profile_name', newProfileName)

  if (newProfileId !== oldProfileId) {
    if (e.auth && e.auth.id === e.record.id && !e.hasSuperuserAuth()) {
      throw new BadRequestError('Você não pode alterar seu próprio perfil de acesso.')
    }

    var oldProfile2 = null
    try {
      oldProfile2 = $app.findRecordById('access_profiles', oldProfileId)
    } catch (_) {}

    if (
      oldProfile2 &&
      oldProfile2.getString('name') === 'Administrador' &&
      newProfileName !== 'Administrador'
    ) {
      var adminUsers = $app.findRecordsByFilter(
        'users',
        "access_profile = '" + oldProfile2.id + "' && status = 'Ativo'",
        '',
        0,
        0,
      )
      if (adminUsers.length <= 1) {
        throw new BadRequestError('Não é possível remover o último administrador ativo.')
      }
    }
  }

  if (e.record.getString('status') === 'Ativo') {
    var permsRaw2 = newProfile.get('permissions')
    var perms2 = normalizePerms(permsRaw2)
    if (perms2 === null) {
      throw new BadRequestError('Formato de permissões inválido no perfil de acesso.')
    }

    var hasPerm2 = false
    if (newProfileName === 'Cliente') {
      hasPerm2 = hasClienteFinPerm(perms2)
    } else {
      hasPerm2 = hasAnyPerm(perms2)
    }

    if (!hasPerm2) {
      if (newProfileName === 'Cliente') {
        throw new BadRequestError(
          'O Perfil Cliente não possui a permissão "Relatório Financeiro - visualizar". Acesse Perfis de Acesso > Cliente > Configurar Permissões antes de criar o usuário.',
        )
      }
      throw new BadRequestError(
        'O perfil de acesso selecionado não possui permissões configuradas. Configure as permissões antes de vincular a um usuário ativo.',
      )
    }
  }

  e.next()
}, 'users')

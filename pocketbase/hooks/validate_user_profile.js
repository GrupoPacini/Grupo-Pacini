onRecordCreateRequest((e) => {
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
    var hasAnyPerm = false
    if (permsRaw) {
      var perms = permsRaw
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms)
        } catch (_) {
          perms = null
        }
      }
      if (perms && typeof perms === 'object' && !Array.isArray(perms)) {
        var pKeys = Object.keys(perms)
        for (var pi = 0; pi < pKeys.length; pi++) {
          var arr = perms[pKeys[pi]]
          if (Array.isArray(arr) && arr.length > 0) {
            hasAnyPerm = true
            break
          }
        }
      }
    }
    if (!hasAnyPerm) {
      if (profileName === 'Cliente') {
        throw new BadRequestError(
          'O Perfil Cliente ainda não possui permissões configuradas. Acesse Perfis de Acesso > Cliente > Configurar Permissões antes de criar o usuário.',
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
    var hasAnyPerm2 = false
    if (permsRaw2) {
      var perms2 = permsRaw2
      if (typeof perms2 === 'string') {
        try {
          perms2 = JSON.parse(perms2)
        } catch (_) {
          perms2 = null
        }
      }
      if (perms2 && typeof perms2 === 'object' && !Array.isArray(perms2)) {
        var pKeys2 = Object.keys(perms2)
        for (var pj = 0; pj < pKeys2.length; pj++) {
          var arr2 = perms2[pKeys2[pj]]
          if (Array.isArray(arr2) && arr2.length > 0) {
            hasAnyPerm2 = true
            break
          }
        }
      }
    }
    if (!hasAnyPerm2) {
      if (newProfileName === 'Cliente') {
        throw new BadRequestError(
          'O Perfil Cliente ainda não possui permissões configuradas. Acesse Perfis de Acesso > Cliente > Configurar Permissões antes de criar o usuário.',
        )
      }
      throw new BadRequestError(
        'O perfil de acesso selecionado não possui permissões configuradas. Configure as permissões antes de vincular a um usuário ativo.',
      )
    }
  }

  e.next()
}, 'users')

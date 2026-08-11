onRecordCreateRequest((e) => {
  var incomingRole = e.record.getString('role')

  if (incomingRole === 'Cliente') {
    var clientId = e.record.getString('client')
    if (!clientId) {
      throw new BadRequestError('Selecione a empresa vinculada ao usuário.')
    }
    try {
      $app.findRecordById('clients', clientId)
    } catch (err) {
      throw new BadRequestError('Empresa vinculada não encontrada.')
    }

    var existingProfileId = e.record.getString('access_profile')
    if (!existingProfileId) {
      try {
        var clienteProfileAuto = $app.findFirstRecordByData('access_profiles', 'name', 'Cliente')
        e.record.set('access_profile', clienteProfileAuto.id)
      } catch (err) {}
    }

    e.record.set('department', '')
    e.record.set('role', 'Cliente')
    e.next()
    return
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
  if (profileName === 'Administrador') {
    e.record.set('role', 'admin')
  } else {
    e.record.set('role', 'colaborador')
  }

  e.next()
}, 'users')

onRecordUpdateRequest((e) => {
  var newRole = e.record.getString('role')
  var oldRole = e.record.original().getString('role')
  var newProfileId = e.record.getString('access_profile')
  var oldProfileId = e.record.original().getString('access_profile')

  if (newRole === 'Cliente') {
    var clientId = e.record.getString('client')
    if (!clientId) {
      throw new BadRequestError('Selecione a empresa vinculada ao usuário.')
    }
    try {
      $app.findRecordById('clients', clientId)
    } catch (err) {
      throw new BadRequestError('Empresa vinculada não encontrada.')
    }

    var existingProfileIdUpdate = e.record.getString('access_profile')
    if (!existingProfileIdUpdate) {
      try {
        var clienteProfileAuto = $app.findFirstRecordByData('access_profiles', 'name', 'Cliente')
        e.record.set('access_profile', clienteProfileAuto.id)
      } catch (err) {}
    }

    if (oldRole === 'admin') {
      var adminsCount = $app.findRecordsByFilter(
        'users',
        "role = 'admin' && status = 'Ativo'",
        '',
        0,
        0,
      ).length
      if (adminsCount <= 1) {
        throw new BadRequestError('Não é possível remover o último administrador ativo.')
      }
    }

    e.record.set('department', '')
    e.record.set('role', 'Cliente')
    e.next()
    return
  }

  if (oldRole === 'Cliente' && newRole !== 'Cliente') {
    e.record.set('client', '')
  }

  if (newProfileId !== oldProfileId) {
    var authId = e.auth ? e.auth.id : ''
    var authRole = e.auth ? e.auth.getString('role') : ''
    var isSuperuser = e.hasSuperuserAuth()

    if (authRole !== 'admin' && !isSuperuser) {
      throw new BadRequestError('Apenas administradores podem alterar perfis de acesso.')
    }

    if (authId === e.record.id && !isSuperuser) {
      throw new BadRequestError('Você não pode alterar seu próprio perfil de acesso.')
    }

    if (!newProfileId) {
      throw new BadRequestError('O usuário deve ter um perfil de acesso vinculado.')
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', newProfileId)
    } catch (err) {
      throw new BadRequestError('Perfil de acesso não encontrado.')
    }

    if (profile.getString('status') !== 'active') {
      throw new BadRequestError('Não é possível vincular a um perfil inativo.')
    }

    if (oldProfileId) {
      var oldProfile = null
      try {
        oldProfile = $app.findRecordById('access_profiles', oldProfileId)
      } catch (err) {}

      if (
        oldProfile &&
        oldProfile.getString('name') === 'Administrador' &&
        profile.getString('name') !== 'Administrador'
      ) {
        var adminsCount2 = $app.findRecordsByFilter(
          'users',
          "role = 'admin' && status = 'Ativo'",
          '',
          0,
          0,
        ).length
        if (adminsCount2 <= 1) {
          throw new BadRequestError('Não é possível remover o último administrador ativo.')
        }
      }
    }

    var profileName = profile.getString('name')
    if (profileName === 'Administrador') {
      e.record.set('role', 'admin')
    } else {
      e.record.set('role', 'colaborador')
    }
  }

  if (newRole !== oldRole && newProfileId === oldProfileId) {
    var authRole2 = e.auth ? e.auth.getString('role') : ''
    var isSuperuser2 = e.hasSuperuserAuth()

    if (authRole2 !== 'admin' && !isSuperuser2) {
      throw new BadRequestError('Apenas administradores podem alterar perfis de usuário.')
    }

    if (e.auth && e.auth.id === e.record.id && !isSuperuser2) {
      throw new BadRequestError('Você não pode alterar seu próprio perfil.')
    }

    if (oldRole === 'admin' && newRole !== 'admin') {
      var adminsCount3 = $app.findRecordsByFilter(
        'users',
        "role = 'admin' && status = 'Ativo'",
        '',
        0,
        0,
      ).length
      if (adminsCount3 <= 1) {
        throw new BadRequestError('Não é possível remover o último administrador ativo.')
      }
    }
  }

  e.next()
}, 'users')

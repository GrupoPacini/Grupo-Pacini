onRecordCreateRequest((e) => {
  var profileId = e.record.getString('access_profile')

  if (!profileId) {
    try {
      var defaultProfile = $app.findFirstRecordByData('access_profiles', 'name', 'Colaborador')
      e.record.set('access_profile', defaultProfile.id)
      profileId = defaultProfile.id
    } catch (err) {
      throw new BadRequestError(
        'Nenhum perfil de acesso selecionado e o perfil padrao nao foi encontrado.',
      )
    }
  }

  var profile
  try {
    profile = $app.findRecordById('access_profiles', profileId)
  } catch (err) {
    throw new BadRequestError('Perfil de acesso nao encontrado.')
  }

  if (profile.getString('status') !== 'active') {
    throw new BadRequestError('Nao e possivel vincular a um perfil inativo.')
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
  var newProfileId = e.record.getString('access_profile')
  var oldProfileId = e.record.original().getString('access_profile')

  if (newProfileId !== oldProfileId) {
    var authId = e.auth ? e.auth.id : ''
    var authRole = e.auth ? e.auth.getString('role') : ''
    var isSuperuser = e.hasSuperuserAuth()
    var userId = e.record.id

    if (authRole !== 'admin' && !isSuperuser) {
      throw new BadRequestError('Apenas administradores podem alterar perfis de acesso.')
    }

    if (authId === userId && !isSuperuser) {
      throw new BadRequestError('Voce nao pode alterar seu proprio perfil de acesso.')
    }

    if (!newProfileId) {
      throw new BadRequestError('O usuario deve ter um perfil de acesso vinculado.')
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', newProfileId)
    } catch (err) {
      throw new BadRequestError('Perfil de acesso nao encontrado.')
    }

    if (profile.getString('status') !== 'active') {
      throw new BadRequestError('Nao e possivel vincular a um perfil inativo.')
    }

    if (oldProfileId) {
      var oldProfile = null
      try {
        oldProfile = $app.findRecordById('access_profiles', oldProfileId)
      } catch (err) {
        // old profile not found — skip last-admin check
      }
      if (
        oldProfile &&
        oldProfile.getString('name') === 'Administrador' &&
        profile.getString('name') !== 'Administrador'
      ) {
        var admins = $app.findRecordsByFilter(
          'users',
          "role = 'admin' && status = 'Ativo'",
          '',
          0,
          0,
        )
        if (admins.length <= 1) {
          throw new BadRequestError('Nao e possivel remover o ultimo administrador ativo.')
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

  var newRole = e.record.getString('role')
  var oldRole = e.record.original().getString('role')
  if (newRole !== oldRole && newProfileId === oldProfileId) {
    var authRole2 = e.auth ? e.auth.getString('role') : ''
    var isSuperuser2 = e.hasSuperuserAuth()

    if (authRole2 !== 'admin' && !isSuperuser2) {
      throw new BadRequestError('Apenas administradores podem alterar perfis de usuario.')
    }

    if (e.auth && e.auth.id === e.record.id && !isSuperuser2) {
      throw new BadRequestError('Voce nao pode alterar seu proprio perfil.')
    }

    if (oldRole === 'admin' && newRole !== 'admin') {
      var admins2 = $app.findRecordsByFilter(
        'users',
        "role = 'admin' && status = 'Ativo'",
        '',
        0,
        0,
      )
      if (admins2.length <= 1) {
        throw new BadRequestError('Nao e possivel remover o ultimo administrador ativo.')
      }
    }
  }

  e.next()
}, 'users')

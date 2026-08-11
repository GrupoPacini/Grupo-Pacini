onRecordValidate((e) => {
  var permsRaw = e.record.get('permissions')

  if (permsRaw === null || permsRaw === undefined || permsRaw === '') {
    return e.next()
  }

  var perms = permsRaw
  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms)
    } catch (_) {
      throw new BadRequestError('Permissões inválidas: formato JSON inválido.')
    }
  }

  if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
    throw new BadRequestError('Permissões inválidas: deve ser um objeto JSON.')
  }

  var keys = Object.keys(perms)
  if (keys.length === 0) {
    return e.next()
  }

  for (var i = 0; i < keys.length; i++) {
    var val = perms[keys[i]]
    if (
      !Array.isArray(val) ||
      !val.every(function (v) {
        return typeof v === 'string'
      })
    ) {
      throw new BadRequestError('Permissões inválidas: cada módulo deve ter um array de strings.')
    }
  }

  var name = e.record.getString('name')
  if (name === 'Administrador') {
    var locked = ['Configurações', 'Gestão de Usuários', 'Perfis de Acesso', 'Segurança']
    for (var k = 0; k < locked.length; k++) {
      var mod = locked[k]
      var modVal = perms[mod]
      if (!Array.isArray(modVal) || modVal.length === 0) {
        throw new BadRequestError(
          'Permissões inválidas: o perfil Administrador deve manter acesso a Configurações, Gestão de Usuários, Perfis de Acesso e Segurança.',
        )
      }
    }
  }

  e.next()
}, 'access_profiles')

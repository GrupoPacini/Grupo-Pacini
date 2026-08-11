onRecordCreateRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      throw new ForbiddenError('Autenticação necessária')
    }

    var collectionName = e.record.collectionName
    var moduleMap = {
      clients: 'Clientes',
      processes: 'Processos',
      licenses: 'Licenças',
      playbooks: 'Playbooks',
      users: 'Gestão de Usuários',
      access_profiles: 'Perfis de Acesso',
      socios: 'Clientes',
      client_cnaes: 'Clientes',
      client_responsibles: 'Clientes',
      process_models: 'Modelos de Processo',
      process_model_stages: 'Modelos de Processo',
      process_model_tasks: 'Modelos de Processo',
    }
    var moduleName = moduleMap[collectionName]
    if (!moduleName) {
      e.next()
      return
    }

    var requiredAction = moduleName === 'Modelos de Processo' ? 'gerenciar' : 'criar'
    var profileId = auth.getString('access_profile')
    if (!profileId) {
      throw new ForbiddenError('Perfil de acesso não vinculado')
    }
    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      throw new ForbiddenError('Perfil de acesso não encontrado')
    }
    if (profile.getString('status') !== 'active') {
      throw new ForbiddenError('Perfil de acesso inativo')
    }

    var permsRaw = profile.get('permissions')
    if (!permsRaw) {
      throw new ForbiddenError('Sem permissões configuradas')
    }
    var perms = permsRaw
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms)
      } catch (_) {
        throw new ForbiddenError('Permissões inválidas')
      }
    }
    var modulePerms = perms[moduleName]
    if (!Array.isArray(modulePerms) || modulePerms.indexOf(requiredAction) === -1) {
      throw new ForbiddenError(
        'Permissão negada para ' + requiredAction + ' registros em ' + moduleName,
      )
    }
    e.next()
  },
  'clients',
  'processes',
  'licenses',
  'playbooks',
  'users',
  'access_profiles',
  'socios',
  'client_cnaes',
  'client_responsibles',
  'process_models',
  'process_model_stages',
  'process_model_tasks',
)

onRecordUpdateRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      throw new ForbiddenError('Autenticação necessária')
    }

    var collectionName = e.record.collectionName
    var moduleMap = {
      clients: 'Clientes',
      processes: 'Processos',
      licenses: 'Licenças',
      playbooks: 'Playbooks',
      users: 'Gestão de Usuários',
      access_profiles: 'Perfis de Acesso',
      socios: 'Clientes',
      client_cnaes: 'Clientes',
      client_responsibles: 'Clientes',
      process_models: 'Modelos de Processo',
      process_model_stages: 'Modelos de Processo',
      process_model_tasks: 'Modelos de Processo',
    }
    var moduleName = moduleMap[collectionName]
    if (!moduleName) {
      e.next()
      return
    }

    if (collectionName === 'users' && auth.id === e.record.id) {
      e.next()
      return
    }

    var requiredAction = moduleName === 'Modelos de Processo' ? 'gerenciar' : 'editar'
    var profileId = auth.getString('access_profile')
    if (!profileId) {
      throw new ForbiddenError('Perfil de acesso não vinculado')
    }
    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      throw new ForbiddenError('Perfil de acesso não encontrado')
    }
    if (profile.getString('status') !== 'active') {
      throw new ForbiddenError('Perfil de acesso inativo')
    }

    var permsRaw = profile.get('permissions')
    if (!permsRaw) {
      throw new ForbiddenError('Sem permissões configuradas')
    }
    var perms = permsRaw
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms)
      } catch (_) {
        throw new ForbiddenError('Permissões inválidas')
      }
    }
    var modulePerms = perms[moduleName]
    if (!Array.isArray(modulePerms) || modulePerms.indexOf(requiredAction) === -1) {
      throw new ForbiddenError(
        'Permissão negada para ' + requiredAction + ' registros em ' + moduleName,
      )
    }
    e.next()
  },
  'clients',
  'processes',
  'licenses',
  'playbooks',
  'users',
  'access_profiles',
  'socios',
  'client_cnaes',
  'client_responsibles',
  'process_models',
  'process_model_stages',
  'process_model_tasks',
)

onRecordDeleteRequest(
  (e) => {
    if (e.hasSuperuserAuth()) {
      e.next()
      return
    }
    var auth = e.auth
    if (!auth) {
      throw new ForbiddenError('Autenticação necessária')
    }

    var collectionName = e.record.collectionName
    var moduleMap = {
      clients: 'Clientes',
      processes: 'Processos',
      licenses: 'Licenças',
      playbooks: 'Playbooks',
      users: 'Gestão de Usuários',
      access_profiles: 'Perfis de Acesso',
      socios: 'Clientes',
      client_cnaes: 'Clientes',
      client_responsibles: 'Clientes',
      process_models: 'Modelos de Processo',
      process_model_stages: 'Modelos de Processo',
      process_model_tasks: 'Modelos de Processo',
    }
    var moduleName = moduleMap[collectionName]
    if (!moduleName) {
      e.next()
      return
    }

    var requiredAction = moduleName === 'Modelos de Processo' ? 'gerenciar' : 'excluir'
    var profileId = auth.getString('access_profile')
    if (!profileId) {
      throw new ForbiddenError('Perfil de acesso não vinculado')
    }
    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (_) {
      throw new ForbiddenError('Perfil de acesso não encontrado')
    }
    if (profile.getString('status') !== 'active') {
      throw new ForbiddenError('Perfil de acesso inativo')
    }

    var permsRaw = profile.get('permissions')
    if (!permsRaw) {
      throw new ForbiddenError('Sem permissões configuradas')
    }
    var perms = permsRaw
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms)
      } catch (_) {
        throw new ForbiddenError('Permissões inválidas')
      }
    }
    var modulePerms = perms[moduleName]
    if (!Array.isArray(modulePerms) || modulePerms.indexOf(requiredAction) === -1) {
      throw new ForbiddenError(
        'Permissão negada para ' + requiredAction + ' registros em ' + moduleName,
      )
    }
    e.next()
  },
  'clients',
  'processes',
  'licenses',
  'playbooks',
  'users',
  'access_profiles',
  'socios',
  'client_cnaes',
  'client_responsibles',
  'process_models',
  'process_model_stages',
  'process_model_tasks',
)

onRecordListRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next()
    return
  }
  var auth = e.auth
  if (!auth) {
    throw new ForbiddenError('Autenticação necessária')
  }

  var profileId = auth.getString('access_profile')
  if (!profileId) {
    throw new ForbiddenError('Perfil de acesso não vinculado')
  }
  var profile
  try {
    profile = $app.findRecordById('access_profiles', profileId)
  } catch (_) {
    throw new ForbiddenError('Perfil não encontrado')
  }
  if (profile.getString('status') !== 'active') {
    throw new ForbiddenError('Perfil inativo')
  }

  var permsRaw = profile.get('permissions')
  if (!permsRaw) {
    throw new ForbiddenError('Sem permissões configuradas')
  }
  var perms = permsRaw
  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms)
    } catch (_) {
      perms = null
    }
  }
  if (!perms || typeof perms !== 'object') {
    throw new ForbiddenError('Permissões inválidas')
  }

  var paPerms = perms['Perfis de Acesso']
  var guPerms = perms['Gestão de Usuários']
  var canViewProfiles = Array.isArray(paPerms) && paPerms.indexOf('visualizar') !== -1
  var canViewUsers = Array.isArray(guPerms) && guPerms.indexOf('visualizar') !== -1
  if (!canViewProfiles && !canViewUsers) {
    throw new ForbiddenError('Permissão negada para visualizar perfis de acesso')
  }
  e.next()
}, 'access_profiles')

onRecordViewRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next()
    return
  }
  var auth = e.auth
  if (!auth) {
    throw new ForbiddenError('Autenticação necessária')
  }

  if (auth.getString('access_profile') === e.record.id) {
    e.next()
    return
  }

  var profileId = auth.getString('access_profile')
  if (!profileId) {
    throw new ForbiddenError('Perfil de acesso não vinculado')
  }
  var profile
  try {
    profile = $app.findRecordById('access_profiles', profileId)
  } catch (_) {
    throw new ForbiddenError('Perfil não encontrado')
  }

  var permsRaw = profile.get('permissions')
  if (!permsRaw) {
    throw new ForbiddenError('Sem permissões configuradas')
  }
  var perms = permsRaw
  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms)
    } catch (_) {
      perms = null
    }
  }
  if (!perms || typeof perms !== 'object') {
    throw new ForbiddenError('Permissões inválidas')
  }

  var paPerms = perms['Perfis de Acesso']
  if (!Array.isArray(paPerms) || paPerms.indexOf('visualizar') === -1) {
    throw new ForbiddenError('Permissão negada para visualizar perfis de acesso')
  }
  e.next()
}, 'access_profiles')

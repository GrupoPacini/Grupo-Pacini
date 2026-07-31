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
    if (auth.getString('role') === 'admin') {
      e.next()
      return
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
    }
    var moduleName = moduleMap[collectionName]
    if (!moduleName) {
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
    } catch (err) {
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
    if (!Array.isArray(modulePerms) || modulePerms.indexOf('criar') === -1) {
      throw new ForbiddenError('Permissão negada para criar registros em ' + moduleName)
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
    if (auth.getString('role') === 'admin') {
      e.next()
      return
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

    var profileId = auth.getString('access_profile')
    if (!profileId) {
      throw new ForbiddenError('Perfil de acesso não vinculado')
    }

    var profile
    try {
      profile = $app.findRecordById('access_profiles', profileId)
    } catch (err) {
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
    if (!Array.isArray(modulePerms) || modulePerms.indexOf('editar') === -1) {
      throw new ForbiddenError('Permissão negada para editar registros em ' + moduleName)
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
    if (auth.getString('role') === 'admin') {
      e.next()
      return
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
    }
    var moduleName = moduleMap[collectionName]
    if (!moduleName) {
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
    } catch (err) {
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
    if (!Array.isArray(modulePerms) || modulePerms.indexOf('excluir') === -1) {
      throw new ForbiddenError('Permissão negada para excluir registros em ' + moduleName)
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
)

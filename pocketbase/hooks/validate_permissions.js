function validateAccessProfilePermissions(e) {
  if (e.hasSuperuserAuth()) {
    e.next()
    return
  }

  var permsRaw = e.record.get('permissions')
  if (!permsRaw) {
    e.next()
    return
  }

  var perms = permsRaw
  if (typeof perms === 'string') {
    try {
      perms = JSON.parse(perms)
    } catch (_) {
      throw new BadRequestError('Campo permissions deve ser um JSON válido')
    }
  }

  if (!perms || typeof perms !== 'object' || Array.isArray(perms)) {
    throw new BadRequestError('Campo permissions deve ser um objeto')
  }

  var validModules = {
    Clientes: true,
    Processos: true,
    Licenças: true,
    Playbooks: true,
    'Gestão de Usuários': true,
    'Perfis de Acesso': true,
    'Modelos de Processo': true,
    'Relatórios Financeiros': true,
  }

  var validActions = {
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
    gerenciar: true,
  }

  var keys = Object.keys(perms)
  for (var i = 0; i < keys.length; i++) {
    var moduleName = keys[i]
    if (!validModules[moduleName]) {
      throw new BadRequestError('Módulo desconhecido: ' + moduleName)
    }
    var actions = perms[moduleName]
    if (!Array.isArray(actions)) {
      throw new BadRequestError('Permissões do módulo ' + moduleName + ' devem ser um array')
    }
    for (var j = 0; j < actions.length; j++) {
      if (!validActions[actions[j]]) {
        throw new BadRequestError('Ação desconhecida: ' + actions[j] + ' no módulo ' + moduleName)
      }
    }
  }

  e.next()
}

onRecordCreateRequest(validateAccessProfilePermissions, 'access_profiles')

onRecordUpdateRequest(validateAccessProfilePermissions, 'access_profiles')

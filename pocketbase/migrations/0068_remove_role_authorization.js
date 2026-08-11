migrate(
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('profile_name')) {
      usersCol.fields.add(new TextField({ name: 'profile_name' }))
      app.save(usersCol)
    }

    var users = app.findRecordsByFilter('users', 'id != ""', '', 0, 0)
    for (var i = 0; i < users.length; i++) {
      var u = users[i]
      var pid = u.getString('access_profile')
      if (pid) {
        try {
          var prof = app.findRecordById('access_profiles', pid)
          u.set('profile_name', prof.getString('name'))
          app.save(u)
        } catch (_) {}
      }
    }

    var apCol = app.findCollectionByNameOrId('access_profiles')
    apCol.listRule = "@request.auth.id != ''"
    apCol.viewRule = "@request.auth.id != ''"
    apCol.createRule = "@request.auth.id != ''"
    apCol.updateRule = "@request.auth.id != ''"
    apCol.deleteRule = "@request.auth.id != ''"
    app.save(apCol)

    var ftCol = app.findCollectionByNameOrId('financial_transactions')
    ftCol.listRule =
      "@request.auth.id != '' && (@request.auth.profile_name != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    ftCol.viewRule =
      "@request.auth.id != '' && (@request.auth.profile_name != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    ftCol.createRule = "@request.auth.id != '' && @request.auth.profile_name != 'Cliente'"
    ftCol.updateRule = "@request.auth.id != '' && @request.auth.profile_name != 'Cliente'"
    ftCol.deleteRule = "@request.auth.id != '' && @request.auth.profile_name != 'Cliente'"
    app.save(ftCol)

    var friCol = app.findCollectionByNameOrId('financial_report_imports')
    friCol.listRule =
      "@request.auth.id != '' && (@request.auth.profile_name != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    friCol.viewRule =
      "@request.auth.id != '' && (@request.auth.profile_name != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    friCol.createRule = "@request.auth.id != '' && @request.auth.profile_name != 'Cliente'"
    friCol.updateRule = "@request.auth.id != '' && @request.auth.profile_name != 'Cliente'"
    friCol.deleteRule = "@request.auth.id != '' && @request.auth.profile_name != 'Cliente'"
    app.save(friCol)

    var adminPerms = {
      Dashboard: ['visualizar'],
      Clientes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Processos: ['visualizar', 'criar', 'editar', 'excluir', 'concluir', 'exportar', 'gerenciar'],
      'Modelos de Processo': ['visualizar', 'gerenciar'],
      Licenças: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Renovações: ['visualizar', 'criar', 'editar', 'exportar', 'gerenciar'],
      'Relatório Financeiro': ['visualizar', 'importar', 'substituir', 'excluir'],
      Playbooks: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      'Assistente IA': ['utilizar'],
      Configurações: ['acessar'],
      'Gestão de Usuários': ['visualizar', 'criar', 'editar', 'excluir'],
      'Perfis de Acesso': ['visualizar', 'criar', 'editar', 'excluir'],
      Auditoria: ['visualizar', 'exportar'],
      Integrações: ['visualizar', 'criar', 'editar', 'excluir'],
      'Preferências do Sistema': ['visualizar', 'editar'],
      Segurança: ['visualizar', 'editar', 'gerenciar'],
    }

    try {
      var adminProfile = app.findFirstRecordByData('access_profiles', 'name', 'Administrador')
      var existing = adminProfile.get('permissions')
      var needSeed = false
      if (!existing || existing === '' || existing === '{}') {
        needSeed = true
      } else if (typeof existing === 'object') {
        var ek = Object.keys(existing)
        if (ek.length === 0) needSeed = true
      }
      if (needSeed) {
        adminProfile.set('permissions', adminPerms)
        app.save(adminProfile)
      }
    } catch (_) {}
  },
  (app) => {
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var pnField = usersCol.fields.getByName('profile_name')
    if (pnField) {
      usersCol.fields.remove(pnField)
      app.save(usersCol)
    }

    var apCol = app.findCollectionByNameOrId('access_profiles')
    apCol.listRule = "@request.auth.role = 'admin'"
    apCol.viewRule = "@request.auth.role = 'admin' || id = @request.auth.access_profile"
    apCol.createRule = "@request.auth.id != ''"
    apCol.updateRule = "@request.auth.id != ''"
    apCol.deleteRule = "@request.auth.id != ''"
    app.save(apCol)

    var ftCol = app.findCollectionByNameOrId('financial_transactions')
    ftCol.listRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    ftCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    ftCol.createRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    ftCol.updateRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    ftCol.deleteRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    app.save(ftCol)

    var friCol = app.findCollectionByNameOrId('financial_report_imports')
    friCol.listRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    friCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    friCol.createRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    friCol.updateRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    friCol.deleteRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    app.save(friCol)
  },
)

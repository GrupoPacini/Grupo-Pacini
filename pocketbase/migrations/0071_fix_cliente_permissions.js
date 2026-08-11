migrate(
  (app) => {
    var allProfiles = app.findRecordsByFilter('access_profiles', "id != ''", 'name', 0, 0)

    var clienteProfiles = []
    for (var i = 0; i < allProfiles.length; i++) {
      var name = (allProfiles[i].getString('name') || '').trim().toLowerCase()
      if (name === 'cliente') {
        clienteProfiles.push(allProfiles[i])
      }
    }

    var clientePerms = {
      Dashboard: ['visualizar'],
      'Relatório Financeiro': ['visualizar'],
    }

    if (clienteProfiles.length === 0) {
      var col = app.findCollectionByNameOrId('access_profiles')
      var rec = new Record(col)
      rec.set('name', 'Cliente')
      rec.set(
        'description',
        'Perfil de acesso para usuários do tipo Cliente. Permite visualização do Relatório Financeiro.',
      )
      rec.set('status', 'active')
      rec.set('system', true)
      rec.set('permissions', clientePerms)
      app.save(rec)
      return
    }

    var target = clienteProfiles[0]

    if (clienteProfiles.length > 1) {
      for (var j = 0; j < clienteProfiles.length; j++) {
        try {
          var linkedUsers = app.findRecordsByFilter(
            'users',
            "access_profile = '" + clienteProfiles[j].id + "'",
            '',
            0,
            0,
          )
          if (linkedUsers.length > 0) {
            target = clienteProfiles[j]
            break
          }
        } catch (_) {}
      }
      console.log(
        'Found ' +
          clienteProfiles.length +
          ' Cliente profiles. Consolidating into id: ' +
          target.id +
          ' (name: ' +
          target.getString('name') +
          ')',
      )
    }

    target.set(
      'description',
      'Perfil de acesso para usuários do tipo Cliente. Permite visualização do Relatório Financeiro.',
    )
    target.set('status', 'active')
    target.set('system', true)
    target.set('permissions', clientePerms)
    app.save(target)

    if (target.getString('name') !== 'Cliente') {
      try {
        target.set('name', 'Cliente')
        app.save(target)
      } catch (_) {
        console.log(
          'Could not rename profile to "Cliente" due to unique constraint. Current name: ' +
            target.getString('name'),
        )
      }
    }
  },
  (app) => {},
)

migrate(
  (app) => {
    var dataCollections = ['clients', 'processes', 'licenses', 'playbooks']
    for (var i = 0; i < dataCollections.length; i++) {
      var col = app.findCollectionByNameOrId(dataCollections[i])
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule = "@request.auth.id != ''"
      app.save(col)
    }

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.createRule = "@request.auth.id != ''"
    usersCol.updateRule = "@request.auth.id != ''"
    usersCol.deleteRule = "@request.auth.id != ''"
    app.save(usersCol)

    var apCol = app.findCollectionByNameOrId('access_profiles')
    apCol.viewRule = "@request.auth.role = 'admin' || id = @request.auth.access_profile"
    apCol.createRule = "@request.auth.id != ''"
    apCol.updateRule = "@request.auth.id != ''"
    apCol.deleteRule = "@request.auth.id != ''"
    app.save(apCol)
  },
  (app) => {
    var dataCollections = ['clients', 'processes', 'licenses', 'playbooks']
    for (var i = 0; i < dataCollections.length; i++) {
      var col = app.findCollectionByNameOrId(dataCollections[i])
      col.createRule = "@request.auth.role = 'admin'"
      col.updateRule = "@request.auth.role = 'admin'"
      col.deleteRule = "@request.auth.role = 'admin'"
      app.save(col)
    }

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.createRule = "@request.auth.role = 'admin'"
    usersCol.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    usersCol.deleteRule = "@request.auth.role = 'admin'"
    app.save(usersCol)

    var apCol = app.findCollectionByNameOrId('access_profiles')
    apCol.viewRule = "@request.auth.role = 'admin'"
    apCol.createRule = "@request.auth.role = 'admin'"
    apCol.updateRule = "@request.auth.role = 'admin'"
    apCol.deleteRule = "@request.auth.role = 'admin'"
    app.save(apCol)
  },
)

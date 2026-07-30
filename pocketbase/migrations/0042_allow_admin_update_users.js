migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    app.save(usersCol)
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.updateRule = 'id = @request.auth.id'
    app.save(usersCol)
  },
)

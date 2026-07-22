migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'colaborador'],
          maxSelect: 1,
        }),
      )
    }
    app.save(usersCol)

    app
      .db()
      .newQuery("UPDATE users SET role = 'colaborador' WHERE role IS NULL OR role = ''")
      .execute()

    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'patricia@grupopacini.com.br')
      admin.set('role', 'admin')
      app.save(admin)
    } catch (_) {}

    const collections = ['clients', 'processes', 'playbooks', 'departments', 'licenses']
    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.createRule = "@request.auth.role = 'admin'"
      col.updateRule = "@request.auth.role = 'admin'"
      col.deleteRule = "@request.auth.role = 'admin'"
      app.save(col)
    }
  },
  (app) => {
    const collections = ['clients', 'processes', 'playbooks', 'departments', 'licenses']
    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule = "@request.auth.id != ''"
      app.save(col)
    }

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) usersCol.fields.removeById(roleField.id)
    app.save(usersCol)
  },
)

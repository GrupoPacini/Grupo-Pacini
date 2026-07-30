migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const deptId = app.findCollectionByNameOrId('departments').id

    if (!usersCol.fields.getByName('department')) {
      usersCol.fields.add(
        new RelationField({
          name: 'department',
          collectionId: deptId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    if (!usersCol.fields.getByName('status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Ativo', 'Inativo', 'Bloqueado', 'Convite pendente'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('last_access')) {
      usersCol.fields.add(
        new DateField({
          name: 'last_access',
        }),
      )
    }

    usersCol.listRule = "@request.auth.role = 'admin'"
    usersCol.viewRule = "@request.auth.role = 'admin'"
    usersCol.createRule = "@request.auth.role = 'admin'"
    usersCol.updateRule = "@request.auth.role = 'admin'"
    usersCol.deleteRule = "@request.auth.role = 'admin'"

    app.save(usersCol)

    app
      .db()
      .newQuery("UPDATE users SET status = 'Ativo' WHERE status IS NULL OR status = ''")
      .execute()
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    usersCol.createRule = ''
    usersCol.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    usersCol.deleteRule = 'id = @request.auth.id'
    app.save(usersCol)

    const deptField = usersCol.fields.getByName('department')
    if (deptField) usersCol.fields.removeById(deptField.id)
    const statusField = usersCol.fields.getByName('status')
    if (statusField) usersCol.fields.removeById(statusField.id)
    const lastAccessField = usersCol.fields.getByName('last_access')
    if (lastAccessField) usersCol.fields.removeById(lastAccessField.id)
    app.save(usersCol)
  },
)

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var roleField = usersCol.fields.getByName('role')
    if (roleField) {
      usersCol.fields.removeById(roleField.id)
    }
    usersCol.fields.add(
      new SelectField({
        name: 'role',
        values: ['admin', 'colaborador', 'Cliente'],
        maxSelect: 1,
      }),
    )

    if (!usersCol.fields.getByName('client')) {
      var clientsId = app.findCollectionByNameOrId('clients').id
      usersCol.fields.add(
        new RelationField({
          name: 'client',
          collectionId: clientsId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    app.save(usersCol)
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    var roleField = usersCol.fields.getByName('role')
    if (roleField) {
      usersCol.fields.removeById(roleField.id)
    }
    usersCol.fields.add(
      new SelectField({
        name: 'role',
        values: ['admin', 'colaborador'],
        maxSelect: 1,
      }),
    )

    var clientField = usersCol.fields.getByName('client')
    if (clientField) {
      usersCol.fields.removeById(clientField.id)
    }

    app.save(usersCol)
  },
)

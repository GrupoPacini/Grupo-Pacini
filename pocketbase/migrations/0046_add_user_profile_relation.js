migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const profilesId = app.findCollectionByNameOrId('access_profiles').id

    if (!usersCol.fields.getByName('access_profile')) {
      usersCol.fields.add(
        new RelationField({
          name: 'access_profile',
          collectionId: profilesId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(usersCol)

    const users = app.findRecordsByFilter('users', "id != ''", 'created', 0, 0)
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      if (user.getString('access_profile')) continue

      const role = user.getString('role')
      const profileName = role === 'admin' ? 'Administrador' : 'Colaborador'

      try {
        const profile = app.findFirstRecordByData('access_profiles', 'name', profileName)
        user.set('access_profile', profile.id)
        app.save(user)
      } catch (e) {
        // Profile not found — fail gracefully, user remains without profile
      }
    }
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const field = usersCol.fields.getByName('access_profile')
    if (field) {
      usersCol.fields.removeById(field.id)
      app.save(usersCol)
    }
  },
)

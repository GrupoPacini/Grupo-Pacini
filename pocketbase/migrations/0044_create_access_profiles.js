migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    const collection = new Collection({
      name: 'access_profiles',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['active', 'inactive'],
          maxSelect: 1,
        },
        { name: 'system', type: 'bool', required: false },
        {
          name: 'created_by',
          type: 'relation',
          required: false,
          collectionId: usersId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_access_profiles_name ON access_profiles (name)'],
    })

    app.save(collection)

    const profilesCol = app.findCollectionByNameOrId('access_profiles')

    try {
      app.findFirstRecordByData('access_profiles', 'name', 'Administrador')
    } catch (_) {
      const admin = new Record(profilesCol)
      admin.set('name', 'Administrador')
      admin.set(
        'description',
        'Criar, editar e excluir clientes, criar e alterar processos, alterar licenças, gerenciar usuários',
      )
      admin.set('status', 'active')
      admin.set('system', true)
      app.save(admin)
    }

    try {
      app.findFirstRecordByData('access_profiles', 'name', 'Colaborador')
    } catch (_) {
      const colaborador = new Record(profilesCol)
      colaborador.set('name', 'Colaborador')
      colaborador.set(
        'description',
        'Visualizar dados, sem permissão para criar, editar ou excluir registros',
      )
      colaborador.set('status', 'active')
      colaborador.set('system', true)
      app.save(colaborador)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('access_profiles')
    app.delete(col)
  },
)

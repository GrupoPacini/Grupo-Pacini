migrate(
  (app) => {
    const departments = new Collection({
      name: 'departments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(departments)

    const clients = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'cnpj', type: 'text', required: true },
        {
          name: 'tax_regime',
          type: 'select',
          values: ['Simples', 'Presumido', 'Real'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(clients)

    const processes = new Collection({
      name: 'processes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'client', type: 'relation', collectionId: clients.id, maxSelect: 1 },
        { name: 'department', type: 'relation', collectionId: departments.id, maxSelect: 1 },
        { name: 'title', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'due_date', type: 'date' },
        { name: 'responsible', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'vector', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(processes)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('processes'))
    app.delete(app.findCollectionByNameOrId('clients'))
    app.delete(app.findCollectionByNameOrId('departments'))
  },
)

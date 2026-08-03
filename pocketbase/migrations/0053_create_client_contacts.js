migrate(
  (app) => {
    const clientsCollection = app.findCollectionByNameOrId('clients')

    const collection = new Collection({
      name: 'client_contacts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsCollection.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'email', type: 'text', required: false },
        { name: 'telefone', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_client_contacts_client ON client_contacts (client, created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('client_contacts')
    app.delete(collection)
  },
)

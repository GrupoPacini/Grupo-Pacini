migrate(
  (app) => {
    const deptId = app.findCollectionByNameOrId('departments').id
    const clientId = app.findCollectionByNameOrId('clients').id

    const playbooks = new Collection({
      name: 'playbooks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'department', type: 'relation', collectionId: deptId, maxSelect: 1 },
        { name: 'embedding', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(playbooks)

    const licenses = new Collection({
      name: 'licenses',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'client', type: 'relation', collectionId: clientId, maxSelect: 1 },
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          values: ['Certificado Digital', 'Software', 'Alvará', 'Outros'],
          maxSelect: 1,
        },
        { name: 'expiration_date', type: 'date' },
        {
          name: 'document',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        {
          name: 'status',
          type: 'select',
          values: ['Ativo', 'Expirado', 'Renovando'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_licenses_client_expiry ON licenses (client, expiration_date)'],
    })
    app.save(licenses)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('playbooks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('licenses'))
    } catch (_) {}
  },
)

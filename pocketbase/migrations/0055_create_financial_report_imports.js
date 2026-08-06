migrate(
  (app) => {
    var clientsCollection = app.findCollectionByNameOrId('clients')
    var usersCollection = app.findCollectionByNameOrId('_pb_users_auth_')

    var collection = new Collection({
      name: 'financial_report_imports',
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
        { name: 'month', type: 'number', required: true, min: 1, max: 12, onlyInt: true },
        { name: 'year', type: 'number', required: true, min: 2000, max: 2100, onlyInt: true },
        { name: 'file_name', type: 'text' },
        { name: 'file_type', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['importando', 'importacao_concluida', 'erro_importacao', 'arquivo_invalido'],
          maxSelect: 1,
        },
        {
          name: 'imported_by',
          type: 'relation',
          collectionId: usersCollection.id,
          maxSelect: 1,
        },
        { name: 'imported_at', type: 'date' },
        { name: 'notes', type: 'text' },
        { name: 'record_count', type: 'number', onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_fri_client ON financial_report_imports (client)',
        'CREATE INDEX idx_fri_competence ON financial_report_imports (client, month, year)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('financial_report_imports'))
    } catch (_) {}
  },
)

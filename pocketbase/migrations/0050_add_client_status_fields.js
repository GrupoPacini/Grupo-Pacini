migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('client_status')) {
      col.fields.add(
        new SelectField({
          name: 'client_status',
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('motivo_inativacao')) {
      col.fields.add(new TextField({ name: 'motivo_inativacao' }))
    }

    if (!col.fields.getByName('responsavel_interno')) {
      col.fields.add(
        new RelationField({
          name: 'responsavel_interno',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    if (!col.fields.getByName('nome_contato')) {
      col.fields.add(new TextField({ name: 'nome_contato' }))
    }

    col.addIndex('idx_clients_status', false, 'client_status', '')
    col.addIndex('idx_clients_responsavel', false, 'responsavel_interno', '')

    app.save(col)

    const clients = app.findRecordsByFilter('clients', "id != ''", '', 1000, 0)
    for (const c of clients) {
      if (!c.getString('client_status')) {
        c.set('client_status', 'Ativo')
        try {
          app.save(c)
        } catch (_) {}
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    const fields = ['client_status', 'motivo_inativacao', 'responsavel_interno', 'nome_contato']
    for (const f of fields) {
      const field = col.fields.getByName(f)
      if (field) col.fields.remove(field)
    }
    try {
      col.removeIndex('idx_clients_status')
    } catch (_) {}
    try {
      col.removeIndex('idx_clients_responsavel')
    } catch (_) {}
    app.save(col)
  },
)

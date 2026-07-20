migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('code')) {
      col.fields.add(new TextField({ name: 'code' }))
    }

    if (!col.fields.getByName('alias')) {
      col.fields.add(new TextField({ name: 'alias' }))
    }

    col.addIndex('idx_clients_code', false, 'code', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    const codeField = col.fields.getByName('code')
    if (codeField) col.fields.remove(codeField)

    const aliasField = col.fields.getByName('alias')
    if (aliasField) col.fields.remove(aliasField)

    col.removeIndex('idx_clients_code')

    app.save(col)
  },
)

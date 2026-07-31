migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    if (!col.fields.getByName('codigo_acesso')) {
      col.fields.add(new TextField({ name: 'codigo_acesso' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    const field = col.fields.getByName('codigo_acesso')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)

migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('clients')
    var field = col.fields.getByName('ccm')
    if (field) {
      col.fields.removeById(field.id)
    }
    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('clients')
    if (!col.fields.getByName('ccm')) {
      col.fields.add(new TextField({ name: 'ccm' }))
    }
    app.save(col)
  },
)

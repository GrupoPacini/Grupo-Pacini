migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('financial_report_imports')
    if (!col.fields.getByName('opening_balance')) {
      col.fields.add(new NumberField({ name: 'opening_balance' }))
    }
    app.save(col)
  },
  (app) => {
    var col = app.findCollectionByNameOrId('financial_report_imports')
    var field = col.fields.getByName('opening_balance')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)

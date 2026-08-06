migrate(
  (app) => {
    var importsCollection = app.findCollectionByNameOrId('financial_report_imports')
    var ftCol = app.findCollectionByNameOrId('financial_transactions')

    if (!ftCol.fields.getByName('financial_report_import')) {
      ftCol.fields.add(
        new RelationField({
          name: 'financial_report_import',
          collectionId: importsCollection.id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
      app.save(ftCol)
    }
  },
  (app) => {
    var ftCol = app.findCollectionByNameOrId('financial_transactions')
    var field = ftCol.fields.getByName('financial_report_import')
    if (field) {
      ftCol.fields.remove(field)
      app.save(ftCol)
    }
  },
)

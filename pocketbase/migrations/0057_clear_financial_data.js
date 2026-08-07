migrate(
  (app) => {
    try {
      var txCol = app.findCollectionByNameOrId('financial_transactions')
      app.truncateCollection(txCol)
    } catch (_) {}

    try {
      var impCol = app.findCollectionByNameOrId('financial_report_imports')
      app.truncateCollection(impCol)
    } catch (_) {}
  },
  (app) => {},
)

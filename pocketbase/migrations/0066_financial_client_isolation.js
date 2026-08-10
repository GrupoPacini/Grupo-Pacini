migrate(
  (app) => {
    var ftCol = app.findCollectionByNameOrId('financial_transactions')
    ftCol.listRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    ftCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    ftCol.createRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    ftCol.updateRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    ftCol.deleteRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    app.save(ftCol)

    var friCol = app.findCollectionByNameOrId('financial_report_imports')
    friCol.listRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    friCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role != 'Cliente' || (@request.auth.client != '' && client = @request.auth.client))"
    friCol.createRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    friCol.updateRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    friCol.deleteRule = "@request.auth.id != '' && @request.auth.role != 'Cliente'"
    app.save(friCol)
  },
  (app) => {
    var ftCol = app.findCollectionByNameOrId('financial_transactions')
    ftCol.listRule = "@request.auth.id != ''"
    ftCol.viewRule = "@request.auth.id != ''"
    ftCol.createRule = "@request.auth.id != ''"
    ftCol.updateRule = "@request.auth.id != ''"
    ftCol.deleteRule = "@request.auth.id != ''"
    app.save(ftCol)

    var friCol = app.findCollectionByNameOrId('financial_report_imports')
    friCol.listRule = "@request.auth.id != ''"
    friCol.viewRule = "@request.auth.id != ''"
    friCol.createRule = "@request.auth.id != ''"
    friCol.updateRule = "@request.auth.id != ''"
    friCol.deleteRule = "@request.auth.id != ''"
    app.save(friCol)
  },
)

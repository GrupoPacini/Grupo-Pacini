migrate(
  (app) => {
    try {
      var clients = app.findRecordsByFilter('clients', "code != ''", 'created', 1000, 0)
      var seen = new Map()
      for (var i = 0; i < clients.length; i++) {
        var c = clients[i]
        var lowerCode = c.getString('code').toLowerCase()
        if (seen.has(lowerCode)) {
          c.set('code', '')
          try {
            app.save(c)
          } catch (_) {}
        } else {
          seen.set(lowerCode, c.id)
        }
      }
    } catch (_) {}

    app.db().newQuery('DROP INDEX IF EXISTS `idx_clients_code_unique`').execute()
    app
      .db()
      .newQuery(
        "CREATE UNIQUE INDEX `idx_clients_code_unique` ON `clients` (code COLLATE NOCASE) WHERE code != ''",
      )
      .execute()
  },
  (app) => {
    app.db().newQuery('DROP INDEX IF EXISTS `idx_clients_code_unique`').execute()
  },
)

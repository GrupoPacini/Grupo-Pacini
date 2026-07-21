migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const fieldsToRemove = [
      'proxima_acao',
      'data_emissao',
      'responsible',
      'orgao_emissor',
      'numero_licenca',
      'status_vencimento',
      'document',
      'type',
    ]

    for (const fieldName of fieldsToRemove) {
      const f = col.fields.getByName(fieldName)
      if (f) col.fields.removeById(f.id)
    }

    let needsBackfill = false

    if (!col.fields.getByName('created')) {
      col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
      needsBackfill = true
    }
    if (!col.fields.getByName('updated')) {
      col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
      needsBackfill = true
    }

    app.save(col)

    if (needsBackfill) {
      app
        .db()
        .newQuery(`
      UPDATE licenses 
      SET created = datetime('now') 
      WHERE created = '' OR created IS NULL
    `)
        .execute()
      app
        .db()
        .newQuery(`
      UPDATE licenses 
      SET updated = datetime('now') 
      WHERE updated = '' OR updated IS NULL
    `)
        .execute()
    }
  },
  (app) => {
    // Down migration intentionally empty to preserve data
  },
)

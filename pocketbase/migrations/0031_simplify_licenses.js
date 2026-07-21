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
    ]

    for (const fieldName of fieldsToRemove) {
      const f = col.fields.getByName(fieldName)
      if (f) col.fields.remove(f)
    }

    if (!col.fields.getByName('sem_vencimento')) {
      col.fields.add(new BoolField({ name: 'sem_vencimento' }))
    }

    app.save(col)

    app
      .db()
      .newQuery('UPDATE licenses SET sem_vencimento = 0 WHERE sem_vencimento IS NULL')
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const f = col.fields.getByName('sem_vencimento')
    if (f) col.fields.remove(f)

    app.save(col)
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const statusField = col.fields.getByName('status')
    if (statusField) col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Ativo', 'Pendente', 'Vencido', 'Renovando', 'Próxima ao Vencimento'],
        maxSelect: 1,
      }),
    )

    app.save(col)

    app
      .db()
      .newQuery(
        "UPDATE licenses SET status = 'Ativo' WHERE (sem_vencimento = 1 OR expiration_date = '' OR expiration_date IS NULL) AND status NOT IN ('Renovando', 'Pendente')",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE licenses SET status = 'Vencido' WHERE sem_vencimento = 0 AND expiration_date != '' AND expiration_date IS NOT NULL AND substr(expiration_date, 1, 10) < date('now') AND status NOT IN ('Renovando', 'Pendente')",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE licenses SET status = 'Próxima ao Vencimento' WHERE sem_vencimento = 0 AND expiration_date != '' AND expiration_date IS NOT NULL AND substr(expiration_date, 1, 10) >= date('now') AND substr(expiration_date, 1, 10) <= date('now', '+30 days') AND status NOT IN ('Renovando', 'Pendente')",
      )
      .execute()

    app
      .db()
      .newQuery(
        "UPDATE licenses SET status = 'Ativo' WHERE sem_vencimento = 0 AND expiration_date != '' AND expiration_date IS NOT NULL AND substr(expiration_date, 1, 10) > date('now', '+30 days') AND status NOT IN ('Renovando', 'Pendente')",
      )
      .execute()
  },
  (app) => {},
)

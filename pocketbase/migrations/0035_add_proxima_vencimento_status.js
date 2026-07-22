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
  },
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const statusField = col.fields.getByName('status')
    if (statusField) col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Ativo', 'Pendente', 'Vencido', 'Renovando'],
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
)

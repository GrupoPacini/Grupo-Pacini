migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const statusField = col.fields.getByName('status')
    if (statusField) col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: [
          'Ativo',
          'Vencido',
          'Renovando',
          'Próxima ao Vencimento',
          'Sem Vencimento',
          'Pendente',
          'Em Processo',
        ],
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
        values: [
          'Ativo',
          'Vencido',
          'Renovando',
          'Próxima ao Vencimento',
          'Sem Vencimento',
          'Pendente',
        ],
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
)

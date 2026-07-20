migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    if (!col.fields.getByName('onboarding_status')) {
      col.fields.add(
        new SelectField({
          name: 'onboarding_status',
          values: ['Lead', 'Documentação', 'Configuração', 'Ativo'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)

    const clients = app.findRecordsByFilter('clients', "id != ''", '', 1000, 0)
    for (const c of clients) {
      if (!c.getString('onboarding_status')) {
        c.set('onboarding_status', 'Ativo')
        app.save(c)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    const field = col.fields.getByName('onboarding_status')
    if (field) col.fields.remove(field)
    app.save(col)
  },
)

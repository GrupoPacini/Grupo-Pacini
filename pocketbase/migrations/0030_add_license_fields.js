migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')
    const usersId = '_pb_users_auth_'

    if (!col.fields.getByName('numero_licenca')) {
      col.fields.add(new TextField({ name: 'numero_licenca' }))
    }

    if (!col.fields.getByName('prioridade')) {
      col.fields.add(
        new SelectField({
          name: 'prioridade',
          values: ['Baixa', 'Média', 'Alta'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('proxima_acao')) {
      col.fields.add(new TextField({ name: 'proxima_acao' }))
    }

    if (!col.fields.getByName('status_vencimento')) {
      col.fields.add(
        new SelectField({
          name: 'status_vencimento',
          values: ['Regular', 'Vencida', 'Indeterminado', 'Pendente'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('responsible')) {
      col.fields.add(
        new RelationField({
          name: 'responsible',
          collectionId: usersId,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const f1 = col.fields.getByName('numero_licenca')
    if (f1) col.fields.remove(f1)

    const f2 = col.fields.getByName('prioridade')
    if (f2) col.fields.remove(f2)

    const f3 = col.fields.getByName('proxima_acao')
    if (f3) col.fields.remove(f3)

    const f4 = col.fields.getByName('status_vencimento')
    if (f4) col.fields.remove(f4)

    const f5 = col.fields.getByName('responsible')
    if (f5) col.fields.remove(f5)

    app.save(col)
  },
)

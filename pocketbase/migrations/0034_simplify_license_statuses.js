migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    app.db().newQuery("UPDATE licenses SET status = 'Vencido' WHERE status = 'Expirado'").execute()

    app
      .db()
      .newQuery(
        "UPDATE licenses SET status_operacional = 'Próxima ao Vencimento' WHERE status_operacional = 'Próxima Vencimento'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE licenses SET status_operacional = 'Sem Vencimento' WHERE status_operacional = 'Sem Vencimento Informado'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE licenses SET status_operacional = 'Pendente' WHERE status_operacional IN ('Em Atenção','Em Renovação','Aguardando Cliente','Em Análise Órgão','Com Exigência')",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE licenses SET status_operacional = 'Regular' WHERE status_operacional = 'Concluída'",
      )
      .execute()

    const statusField = col.fields.getByName('status')
    if (statusField) col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Ativo', 'Pendente', 'Vencido', 'Renovando'],
        maxSelect: 1,
      }),
    )

    const statusOpField = col.fields.getByName('status_operacional')
    if (statusOpField) col.fields.removeById(statusOpField.id)
    col.fields.add(
      new SelectField({
        name: 'status_operacional',
        values: ['Regular', 'Próxima ao Vencimento', 'Vencida', 'Sem Vencimento', 'Pendente'],
        maxSelect: 1,
      }),
    )

    const pendenciaField = col.fields.getByName('pendencia_atual')
    if (pendenciaField) col.fields.removeById(pendenciaField.id)

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    app.db().newQuery("UPDATE licenses SET status = 'Expirado' WHERE status = 'Vencido'").execute()

    app
      .db()
      .newQuery(
        "UPDATE licenses SET status_operacional = 'Próxima Vencimento' WHERE status_operacional = 'Próxima ao Vencimento'",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE licenses SET status_operacional = 'Sem Vencimento Informado' WHERE status_operacional = 'Sem Vencimento'",
      )
      .execute()

    const statusField = col.fields.getByName('status')
    if (statusField) col.fields.removeById(statusField.id)
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Ativo', 'Expirado', 'Renovando'],
        maxSelect: 1,
      }),
    )

    const statusOpField = col.fields.getByName('status_operacional')
    if (statusOpField) col.fields.removeById(statusOpField.id)
    col.fields.add(
      new SelectField({
        name: 'status_operacional',
        values: [
          'Regular',
          'Em Atenção',
          'Próxima Vencimento',
          'Vencida',
          'Sem Vencimento Informado',
          'Em Renovação',
          'Aguardando Cliente',
          'Em Análise Órgão',
          'Com Exigência',
          'Concluída',
        ],
        maxSelect: 1,
      }),
    )

    if (!col.fields.getByName('pendencia_atual')) {
      col.fields.add(new TextField({ name: 'pendencia_atual' }))
    }

    app.save(col)
  },
)

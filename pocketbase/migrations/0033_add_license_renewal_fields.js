migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    if (!col.fields.getByName('etapa_renovacao')) {
      col.fields.add(
        new SelectField({
          name: 'etapa_renovacao',
          values: [
            'Protocolado',
            'Em Análise Órgão',
            'Aguardando Cliente',
            'Pendente Documentação',
            'Concluída',
          ],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('documentos_pendentes')) {
      col.fields.add(new TextField({ name: 'documentos_pendentes' }))
    }

    if (!col.fields.getByName('data_renovacao_inicio')) {
      col.fields.add(new DateField({ name: 'data_renovacao_inicio' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('licenses')

    const f1 = col.fields.getByName('etapa_renovacao')
    if (f1) col.fields.removeById(f1.id)

    const f2 = col.fields.getByName('documentos_pendentes')
    if (f2) col.fields.removeById(f2.id)

    const f3 = col.fields.getByName('data_renovacao_inicio')
    if (f3) col.fields.removeById(f3.id)

    app.save(col)
  },
)

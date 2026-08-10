migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE processes SET status = 'Não iniciado' WHERE status = 'Pendente'")
      .execute()
    app
      .db()
      .newQuery("UPDATE processes SET status = 'Em andamento' WHERE status = 'Em Andamento'")
      .execute()
    app
      .db()
      .newQuery("UPDATE processes SET status = 'Em andamento' WHERE status = 'Atrasado'")
      .execute()

    var col = app.findCollectionByNameOrId('processes')

    var statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Não iniciado',
        'Em andamento',
        'Aguardando cliente',
        'Aguardando terceiro',
        'Pausado',
        'Concluído',
        'Cancelado',
      ]
    }

    if (!col.fields.getByName('start_date')) {
      col.fields.add(new DateField({ name: 'start_date' }))
    }

    if (!col.fields.getByName('priority')) {
      col.fields.add(
        new SelectField({ name: 'priority', values: ['Baixa', 'Média', 'Alta'], maxSelect: 1 }),
      )
    }

    col.addIndex('idx_processes_status', false, 'status', '')
    col.addIndex('idx_processes_department', false, 'department', '')
    col.addIndex('idx_processes_responsible', false, 'responsible', '')

    app.save(col)

    var processesId = app.findCollectionByNameOrId('processes').id

    var stagesCol = new Collection({
      name: 'process_stages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'process',
          type: 'relation',
          required: true,
          collectionId: processesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'order', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['Não iniciado', 'Em andamento', 'Concluído'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_process_stages_process ON process_stages (process)'],
    })
    app.save(stagesCol)

    var stagesId = app.findCollectionByNameOrId('process_stages').id

    var tasksCol = new Collection({
      name: 'process_tasks',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'stage',
          type: 'relation',
          required: true,
          collectionId: stagesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'responsible', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'due_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Em andamento', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'observation', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_process_tasks_stage ON process_tasks (stage)',
        'CREATE INDEX idx_process_tasks_responsible ON process_tasks (responsible)',
        'CREATE INDEX idx_process_tasks_status ON process_tasks (status)',
      ],
    })
    app.save(tasksCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('process_tasks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('process_stages'))
    } catch (_) {}

    app
      .db()
      .newQuery("UPDATE processes SET status = 'Pendente' WHERE status = 'Não iniciado'")
      .execute()
    app
      .db()
      .newQuery("UPDATE processes SET status = 'Em Andamento' WHERE status = 'Em andamento'")
      .execute()

    var col = app.findCollectionByNameOrId('processes')
    var sd = col.fields.getByName('start_date')
    if (sd) col.fields.removeById(sd.id)
    var pr = col.fields.getByName('priority')
    if (pr) col.fields.removeById(pr.id)

    var statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Pendente', 'Em Andamento', 'Concluído', 'Atrasado']
    }

    col.removeIndex('idx_processes_status')
    col.removeIndex('idx_processes_department')
    col.removeIndex('idx_processes_responsible')

    app.save(col)
  },
)

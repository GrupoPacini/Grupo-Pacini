migrate(
  (app) => {
    app
      .db()
      .newQuery("UPDATE process_tasks SET priority = 'Normal' WHERE priority = 'Média'")
      .execute()

    var tasksCol = app.findCollectionByNameOrId('process_tasks')

    var statusField = tasksCol.fields.getByName('status')
    if (statusField) {
      statusField.values = [
        'Pendente',
        'Em andamento',
        'Aguardando cliente',
        'Aguardando terceiro',
        'Bloqueada',
        'Concluída',
        'Não aplicável',
      ]
    }

    var priorityField = tasksCol.fields.getByName('priority')
    if (priorityField) {
      priorityField.values = ['Baixa', 'Normal', 'Alta', 'Urgente']
    }

    var depField = tasksCol.fields.getByName('dependency')
    if (depField) {
      depField.maxSelect = 20
    }

    if (!tasksCol.fields.getByName('active')) {
      tasksCol.fields.add(new BoolField({ name: 'active' }))
    }

    if (!tasksCol.fields.getByName('deadline_basis')) {
      tasksCol.fields.add(
        new SelectField({
          name: 'deadline_basis',
          values: ['stage_start', 'previous_task_completion', 'dependent_tasks_completion'],
          maxSelect: 1,
        }),
      )
    }

    app.save(tasksCol)

    app
      .db()
      .newQuery(
        "UPDATE process_tasks SET dependency = '[' || dependency || ']' WHERE dependency IS NOT NULL AND dependency != '' AND dependency NOT LIKE '[%'",
      )
      .execute()

    app
      .db()
      .newQuery('UPDATE process_tasks SET active = 1 WHERE active = 0 OR active IS NULL')
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery("UPDATE process_tasks SET priority = 'Média' WHERE priority = 'Normal'")
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE process_tasks SET dependency = REPLACE(REPLACE(dependency, '[', ''), ']', '') WHERE dependency LIKE '[%'",
      )
      .execute()

    var tasksCol = app.findCollectionByNameOrId('process_tasks')

    var statusField = tasksCol.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Pendente', 'Em andamento', 'Concluída', 'Não aplicável']
    }

    var priorityField = tasksCol.fields.getByName('priority')
    if (priorityField) {
      priorityField.values = ['Baixa', 'Média', 'Alta']
    }

    var depField = tasksCol.fields.getByName('dependency')
    if (depField) {
      depField.maxSelect = 1
    }

    var activeField = tasksCol.fields.getByName('active')
    if (activeField) tasksCol.fields.removeById(activeField.id)

    var deadlineField = tasksCol.fields.getByName('deadline_basis')
    if (deadlineField) tasksCol.fields.removeById(deadlineField.id)

    app.save(tasksCol)
  },
)

migrate(
  (app) => {
    var usersId = '_pb_users_auth_'
    var deptsId = app.findCollectionByNameOrId('departments').id

    app
      .db()
      .newQuery("UPDATE process_stages SET status = 'Não iniciada' WHERE status = 'Não iniciado'")
      .execute()
    app
      .db()
      .newQuery("UPDATE process_stages SET status = 'Concluída' WHERE status = 'Concluído'")
      .execute()

    var stagesCol = app.findCollectionByNameOrId('process_stages')
    var stagesId = stagesCol.id
    var sf = stagesCol.fields.getByName('status')
    if (sf)
      sf.values = [
        'Não iniciada',
        'Em andamento',
        'Aguardando cliente',
        'Aguardando terceiro',
        'Bloqueada',
        'Concluída',
        'Não aplicável',
      ]
    if (!stagesCol.fields.getByName('description'))
      stagesCol.fields.add(new TextField({ name: 'description' }))
    if (!stagesCol.fields.getByName('default_responsible'))
      stagesCol.fields.add(
        new RelationField({ name: 'default_responsible', collectionId: usersId, maxSelect: 1 }),
      )
    if (!stagesCol.fields.getByName('department'))
      stagesCol.fields.add(
        new RelationField({ name: 'department', collectionId: deptsId, maxSelect: 1 }),
      )
    if (!stagesCol.fields.getByName('default_due_days'))
      stagesCol.fields.add(new NumberField({ name: 'default_due_days' }))
    if (!stagesCol.fields.getByName('priority'))
      stagesCol.fields.add(
        new SelectField({ name: 'priority', values: ['Baixa', 'Média', 'Alta'], maxSelect: 1 }),
      )
    if (!stagesCol.fields.getByName('identification_color'))
      stagesCol.fields.add(new TextField({ name: 'identification_color' }))
    if (!stagesCol.fields.getByName('required'))
      stagesCol.fields.add(
        new SelectField({ name: 'required', values: ['sim', 'não'], maxSelect: 1 }),
      )
    if (!stagesCol.fields.getByName('active'))
      stagesCol.fields.add(new BoolField({ name: 'active' }))
    if (!stagesCol.fields.getByName('dependencies'))
      stagesCol.fields.add(
        new RelationField({ name: 'dependencies', collectionId: stagesId, maxSelect: 20 }),
      )
    if (!stagesCol.fields.getByName('start_mode'))
      stagesCol.fields.add(
        new SelectField({
          name: 'start_mode',
          values: ['manual', 'auto_after_previous', 'auto_after_dependencies'],
          maxSelect: 1,
        }),
      )
    if (!stagesCol.fields.getByName('completion_mode'))
      stagesCol.fields.add(
        new SelectField({
          name: 'completion_mode',
          values: ['manual', 'all_required_tasks', 'all_tasks'],
          maxSelect: 1,
        }),
      )
    if (!stagesCol.fields.getByName('deadline_basis'))
      stagesCol.fields.add(
        new SelectField({
          name: 'deadline_basis',
          values: ['process_start', 'previous_stage_completion', 'own_stage_start'],
          maxSelect: 1,
        }),
      )
    app.save(stagesCol)

    var tasksCol = app.findCollectionByNameOrId('process_tasks')
    var tasksId = tasksCol.id
    var tf = tasksCol.fields.getByName('status')
    if (tf) tf.values = ['Pendente', 'Em andamento', 'Concluída', 'Não aplicável']
    if (!tasksCol.fields.getByName('description'))
      tasksCol.fields.add(new TextField({ name: 'description' }))
    if (!tasksCol.fields.getByName('due_days'))
      tasksCol.fields.add(new NumberField({ name: 'due_days' }))
    if (!tasksCol.fields.getByName('priority'))
      tasksCol.fields.add(
        new SelectField({ name: 'priority', values: ['Baixa', 'Média', 'Alta'], maxSelect: 1 }),
      )
    if (!tasksCol.fields.getByName('required'))
      tasksCol.fields.add(
        new SelectField({ name: 'required', values: ['sim', 'não'], maxSelect: 1 }),
      )
    if (!tasksCol.fields.getByName('order')) tasksCol.fields.add(new NumberField({ name: 'order' }))
    if (!tasksCol.fields.getByName('dependency'))
      tasksCol.fields.add(
        new RelationField({ name: 'dependency', collectionId: tasksId, maxSelect: 1 }),
      )
    app.save(tasksCol)

    var msCol = app.findCollectionByNameOrId('process_model_stages')
    var msId = msCol.id
    if (!msCol.fields.getByName('default_responsible'))
      msCol.fields.add(
        new RelationField({ name: 'default_responsible', collectionId: usersId, maxSelect: 1 }),
      )
    if (!msCol.fields.getByName('department'))
      msCol.fields.add(
        new RelationField({ name: 'department', collectionId: deptsId, maxSelect: 1 }),
      )
    if (!msCol.fields.getByName('default_due_days'))
      msCol.fields.add(new NumberField({ name: 'default_due_days' }))
    if (!msCol.fields.getByName('priority'))
      msCol.fields.add(
        new SelectField({ name: 'priority', values: ['Baixa', 'Média', 'Alta'], maxSelect: 1 }),
      )
    if (!msCol.fields.getByName('status'))
      msCol.fields.add(
        new SelectField({
          name: 'status',
          values: [
            'Não iniciada',
            'Em andamento',
            'Aguardando cliente',
            'Aguardando terceiro',
            'Bloqueada',
            'Concluída',
            'Não aplicável',
          ],
          maxSelect: 1,
        }),
      )
    if (!msCol.fields.getByName('identification_color'))
      msCol.fields.add(new TextField({ name: 'identification_color' }))
    if (!msCol.fields.getByName('required'))
      msCol.fields.add(new SelectField({ name: 'required', values: ['sim', 'não'], maxSelect: 1 }))
    if (!msCol.fields.getByName('active')) msCol.fields.add(new BoolField({ name: 'active' }))
    if (!msCol.fields.getByName('dependencies'))
      msCol.fields.add(
        new RelationField({ name: 'dependencies', collectionId: msId, maxSelect: 20 }),
      )
    if (!msCol.fields.getByName('start_mode'))
      msCol.fields.add(
        new SelectField({
          name: 'start_mode',
          values: ['manual', 'auto_after_previous', 'auto_after_dependencies'],
          maxSelect: 1,
        }),
      )
    if (!msCol.fields.getByName('completion_mode'))
      msCol.fields.add(
        new SelectField({
          name: 'completion_mode',
          values: ['manual', 'all_required_tasks', 'all_tasks'],
          maxSelect: 1,
        }),
      )
    if (!msCol.fields.getByName('deadline_basis'))
      msCol.fields.add(
        new SelectField({
          name: 'deadline_basis',
          values: ['process_start', 'previous_stage_completion', 'own_stage_start'],
          maxSelect: 1,
        }),
      )
    app.save(msCol)

    var mtCol = app.findCollectionByNameOrId('process_model_tasks')
    var mtId = mtCol.id
    if (!mtCol.fields.getByName('status'))
      mtCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['Pendente', 'Em andamento', 'Concluída', 'Não aplicável'],
          maxSelect: 1,
        }),
      )
    if (!mtCol.fields.getByName('priority'))
      mtCol.fields.add(
        new SelectField({ name: 'priority', values: ['Baixa', 'Média', 'Alta'], maxSelect: 1 }),
      )
    if (!mtCol.fields.getByName('dependency'))
      mtCol.fields.add(new RelationField({ name: 'dependency', collectionId: mtId, maxSelect: 1 }))
    app.save(mtCol)

    var RULES = {
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
    }

    app.save(
      new Collection(
        Object.assign(
          {
            name: 'process_task_checklists',
            type: 'base',
            fields: [
              {
                name: 'task',
                type: 'relation',
                required: true,
                collectionId: tasksId,
                cascadeDelete: true,
                maxSelect: 1,
              },
              { name: 'description', type: 'text', required: true },
              { name: 'completed', type: 'bool' },
              { name: 'order', type: 'number' },
              { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
              { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            ],
            indexes: ['CREATE INDEX idx_ptc_task ON process_task_checklists (task)'],
          },
          RULES,
        ),
      ),
    )

    app.save(
      new Collection(
        Object.assign(
          {
            name: 'process_stage_custom_fields',
            type: 'base',
            fields: [
              {
                name: 'stage',
                type: 'relation',
                required: true,
                collectionId: stagesId,
                cascadeDelete: true,
                maxSelect: 1,
              },
              { name: 'label', type: 'text', required: true },
              {
                name: 'field_type',
                type: 'select',
                values: ['texto', 'numero', 'data', 'sim_nao', 'lista_opcoes', 'observacao_longa'],
                maxSelect: 1,
              },
              { name: 'options', type: 'json' },
              { name: 'value', type: 'text' },
              { name: 'order', type: 'number' },
              { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
              { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            ],
            indexes: ['CREATE INDEX idx_pscf_stage ON process_stage_custom_fields (stage)'],
          },
          RULES,
        ),
      ),
    )

    app.save(
      new Collection(
        Object.assign(
          {
            name: 'process_stage_observations',
            type: 'base',
            fields: [
              {
                name: 'stage',
                type: 'relation',
                required: true,
                collectionId: stagesId,
                cascadeDelete: true,
                maxSelect: 1,
              },
              { name: 'user', type: 'relation', collectionId: usersId, maxSelect: 1 },
              { name: 'text', type: 'text', required: true },
              { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
              { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            ],
            indexes: [
              'CREATE INDEX idx_pso_stage ON process_stage_observations (stage, created DESC)',
            ],
          },
          RULES,
        ),
      ),
    )

    app.save(
      new Collection(
        Object.assign(
          {
            name: 'process_model_task_checklists',
            type: 'base',
            fields: [
              {
                name: 'task',
                type: 'relation',
                required: true,
                collectionId: mtId,
                cascadeDelete: true,
                maxSelect: 1,
              },
              { name: 'description', type: 'text', required: true },
              { name: 'completed', type: 'bool' },
              { name: 'order', type: 'number' },
              { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
              { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            ],
            indexes: ['CREATE INDEX idx_pmtc_task ON process_model_task_checklists (task)'],
          },
          RULES,
        ),
      ),
    )

    app.save(
      new Collection(
        Object.assign(
          {
            name: 'process_model_stage_custom_fields',
            type: 'base',
            fields: [
              {
                name: 'stage',
                type: 'relation',
                required: true,
                collectionId: msId,
                cascadeDelete: true,
                maxSelect: 1,
              },
              { name: 'label', type: 'text', required: true },
              {
                name: 'field_type',
                type: 'select',
                values: ['texto', 'numero', 'data', 'sim_nao', 'lista_opcoes', 'observacao_longa'],
                maxSelect: 1,
              },
              { name: 'options', type: 'json' },
              { name: 'value', type: 'text' },
              { name: 'order', type: 'number' },
              { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
              { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            ],
            indexes: ['CREATE INDEX idx_pmscf_stage ON process_model_stage_custom_fields (stage)'],
          },
          RULES,
        ),
      ),
    )

    app.save(
      new Collection(
        Object.assign(
          {
            name: 'process_model_stage_observations',
            type: 'base',
            fields: [
              {
                name: 'stage',
                type: 'relation',
                required: true,
                collectionId: msId,
                cascadeDelete: true,
                maxSelect: 1,
              },
              { name: 'user', type: 'relation', collectionId: usersId, maxSelect: 1 },
              { name: 'text', type: 'text', required: true },
              { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
              { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            ],
            indexes: [
              'CREATE INDEX idx_pmso_stage ON process_model_stage_observations (stage, created DESC)',
            ],
          },
          RULES,
        ),
      ),
    )
  },
  (app) => {
    var cols = [
      'process_model_stage_observations',
      'process_model_stage_custom_fields',
      'process_model_task_checklists',
      'process_stage_observations',
      'process_stage_custom_fields',
      'process_task_checklists',
    ]
    for (var i = 0; i < cols.length; i++) {
      try {
        app.delete(app.findCollectionByNameOrId(cols[i]))
      } catch (_) {}
    }
  },
)

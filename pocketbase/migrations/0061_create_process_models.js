migrate(
  (app) => {
    var departmentsId = app.findCollectionByNameOrId('departments').id
    var usersId = '_pb_users_auth_'

    var modelsCol = new Collection({
      name: 'process_models',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'department', type: 'relation', collectionId: departmentsId, maxSelect: 1 },
        { name: 'type', type: 'select', values: ['eventual', 'recorrente'], maxSelect: 1 },
        { name: 'status', type: 'select', values: ['ativo', 'inativo'], maxSelect: 1 },
        { name: 'created_by', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_process_models_department ON process_models (department)',
        'CREATE INDEX idx_process_models_type ON process_models (type)',
        'CREATE INDEX idx_process_models_status ON process_models (status)',
      ],
    })
    app.save(modelsCol)

    var modelsId = app.findCollectionByNameOrId('process_models').id

    var stagesCol = new Collection({
      name: 'process_model_stages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'model',
          type: 'relation',
          required: true,
          collectionId: modelsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'order', type: 'number' },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pms_model ON process_model_stages (model)',
        'CREATE INDEX idx_pms_order ON process_model_stages (model, order)',
      ],
    })
    app.save(stagesCol)

    var modelStagesId = app.findCollectionByNameOrId('process_model_stages').id

    var tasksCol = new Collection({
      name: 'process_model_tasks',
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
          collectionId: modelStagesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'default_due_days', type: 'number' },
        { name: 'default_responsible', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'required', type: 'select', values: ['sim', 'não'], maxSelect: 1 },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pmt_stage ON process_model_tasks (stage)',
        'CREATE INDEX idx_pmt_order ON process_model_tasks (stage, order)',
      ],
    })
    app.save(tasksCol)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('process_model_tasks'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('process_model_stages'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('process_models'))
    } catch (_) {}
  },
)

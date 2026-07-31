migrate(
  (app) => {
    var clientsCol = app.findCollectionByNameOrId('clients')

    var textFields = [
      'inscricao_estadual',
      'inscricao_municipal',
      'ccm',
      'natureza_juridica',
      'porte',
      'cep',
      'logradouro',
      'numero',
      'complemento',
      'bairro',
      'telefone',
      'celular',
      'whatsapp',
      'email_principal',
      'site',
      'situacao_cadastral',
      'observacoes_internas',
    ]

    for (var i = 0; i < textFields.length; i++) {
      if (!clientsCol.fields.getByName(textFields[i])) {
        clientsCol.fields.add(new TextField({ name: textFields[i] }))
      }
    }

    if (!clientsCol.fields.getByName('data_abertura')) {
      clientsCol.fields.add(new DateField({ name: 'data_abertura' }))
    }

    if (!clientsCol.fields.getByName('observacoes_atualizado_em')) {
      clientsCol.fields.add(new DateField({ name: 'observacoes_atualizado_em' }))
    }

    if (!clientsCol.fields.getByName('observacoes_atualizado_por')) {
      clientsCol.fields.add(
        new RelationField({
          name: 'observacoes_atualizado_por',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }

    app.save(clientsCol)

    var clientsId = app.findCollectionByNameOrId('clients').id
    var deptsId = app.findCollectionByNameOrId('departments').id

    var sociosCol = new Collection({
      name: 'socios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cpf', type: 'text' },
        { name: 'participacao_societaria', type: 'number' },
        { name: 'cargo', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'administrador', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(sociosCol)

    var cnaesCol = new Collection({
      name: 'client_cnaes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'code', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'is_principal', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(cnaesCol)

    var respCol = new Collection({
      name: 'client_responsibles',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'client',
          type: 'relation',
          required: true,
          collectionId: clientsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'department',
          type: 'relation',
          collectionId: deptsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'role', type: 'text' },
        { name: 'observations', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [],
    })
    app.save(respCol)

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    app.save(usersCol)

    var allClients = app.findRecordsByFilter('clients', "id != ''", 'name', 0, 0)
    var cnaesCollection = app.findCollectionByNameOrId('client_cnaes')

    for (var j = 0; j < allClients.length; j++) {
      var client = allClients[j]
      var clientId = client.id

      var existingCnaes = app.findRecordsByFilter(
        'client_cnaes',
        "client = '" + clientId + "'",
        'created',
        0,
        0,
      )
      if (existingCnaes.length > 0) continue

      var principalCnae = client.getString('cnae_principal')
      if (principalCnae) {
        var rec = new Record(cnaesCollection)
        rec.set('client', clientId)
        rec.set('code', principalCnae)
        rec.set('description', '')
        rec.set('is_principal', true)
        app.save(rec)
      }

      var secondaryCnaes = client.get('cnaes_secundarios')
      if (secondaryCnaes) {
        var cnaeList = secondaryCnaes
        if (typeof secondaryCnaes === 'string') {
          try {
            cnaeList = JSON.parse(secondaryCnaes)
          } catch (_) {
            cnaeList = []
          }
        }
        if (Array.isArray(cnaeList)) {
          for (var k = 0; k < cnaeList.length; k++) {
            var rec2 = new Record(cnaesCollection)
            rec2.set('client', clientId)
            rec2.set('code', String(cnaeList[k]))
            rec2.set('description', '')
            rec2.set('is_principal', false)
            app.save(rec2)
          }
        }
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('socios'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('client_cnaes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('client_responsibles'))
    } catch (_) {}

    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    usersCol.listRule = "@request.auth.role = 'admin'"
    usersCol.viewRule = "@request.auth.role = 'admin'"
    app.save(usersCol)
  },
)

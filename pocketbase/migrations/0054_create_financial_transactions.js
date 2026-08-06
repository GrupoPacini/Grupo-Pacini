migrate(
  (app) => {
    var clientsCollection = app.findCollectionByNameOrId('clients')

    var collection = new Collection({
      name: 'financial_transactions',
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
          collectionId: clientsCollection.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'description', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'account', type: 'text' },
        { name: 'project', type: 'text' },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Receita', 'Despesa'],
          maxSelect: 1,
        },
        { name: 'value', type: 'number', required: true, min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pago', 'Pendente', 'Atrasado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ft_client ON financial_transactions (client)',
        'CREATE INDEX idx_ft_date ON financial_transactions (date)',
        'CREATE INDEX idx_ft_category ON financial_transactions (category)',
        'CREATE INDEX idx_ft_account ON financial_transactions (account)',
        'CREATE INDEX idx_ft_project ON financial_transactions (project)',
        'CREATE INDEX idx_ft_type ON financial_transactions (type)',
        'CREATE INDEX idx_ft_status ON financial_transactions (status)',
      ],
    })
    app.save(collection)

    try {
      var existing = app.countRecords('financial_transactions')
      if (existing > 0) return
    } catch (_) {}

    var ftCol = app.findCollectionByNameOrId('financial_transactions')
    var clientRecords = []
    try {
      clientRecords = app.findRecordsByFilter('clients', '', 'name', 10, 0)
    } catch (_) {}
    if (clientRecords.length === 0) return

    var clients = clientRecords.slice(0, Math.min(3, clientRecords.length))
    var months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
    var seeds = []

    for (var ci = 0; ci < clients.length; ci++) {
      var cid = clients[ci].id
      for (var mi = 0; mi < months.length; mi++) {
        var m = months[mi]
        seeds.push({
          client: cid,
          date: m + '-05',
          description: 'Honorarios Contabeis - Mensalidade',
          category: 'Honorarios Contabeis',
          account: 'Banco Principal',
          project: 'Geral',
          type: 'Receita',
          value: 3500 + ci * 500,
          status: 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-10',
          description: 'Consultoria Tributaria',
          category: 'Consultoria',
          account: 'Banco Principal',
          project: 'Projeto Alpha',
          type: 'Receita',
          value: 1200 + mi * 100,
          status: mi % 3 === 0 ? 'Pendente' : 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-15',
          description: 'Servicos de Folha',
          category: 'Folha de Pagamento',
          account: 'Caixa',
          project: 'Geral',
          type: 'Receita',
          value: 800,
          status: 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-02',
          description: 'Folha de Pagamento',
          category: 'Folha de Pagamento',
          account: 'Banco Principal',
          project: 'Geral',
          type: 'Despesa',
          value: 2800 + mi * 150,
          status: 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-05',
          description: 'Impostos Federais',
          category: 'Impostos',
          account: 'Banco Principal',
          project: 'Geral',
          type: 'Despesa',
          value: 850 + mi * 50,
          status: mi === 5 ? 'Atrasado' : 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-08',
          description: 'Aluguel do Escritorio',
          category: 'Operacional',
          account: 'Caixa',
          project: 'Geral',
          type: 'Despesa',
          value: 1500,
          status: 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-12',
          description: 'Energia Eletrica',
          category: 'Operacional',
          account: 'Caixa',
          project: 'Geral',
          type: 'Despesa',
          value: 320 + mi * 20,
          status: 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-20',
          description: 'Software de Gestao',
          category: 'Operacional',
          account: 'Conta Investimento',
          project: 'Projeto Beta',
          type: 'Despesa',
          value: 450,
          status: mi % 2 === 0 ? 'Pendente' : 'Pago',
        })
        seeds.push({
          client: cid,
          date: m + '-25',
          description: 'Marketing Digital',
          category: 'Operacional',
          account: 'Conta Investimento',
          project: 'Projeto Alpha',
          type: 'Despesa',
          value: 600,
          status: mi === 4 ? 'Atrasado' : 'Pago',
        })
      }
    }

    for (var i = 0; i < seeds.length; i++) {
      var sd = seeds[i]
      var rec = new Record(ftCol)
      rec.set('client', sd.client)
      rec.set('date', sd.date)
      rec.set('description', sd.description)
      rec.set('category', sd.category)
      rec.set('account', sd.account)
      rec.set('project', sd.project)
      rec.set('type', sd.type)
      rec.set('value', sd.value)
      rec.set('status', sd.status)
      app.save(rec)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('financial_transactions'))
    } catch (_) {}
  },
)

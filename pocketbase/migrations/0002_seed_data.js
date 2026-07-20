migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'patricia@grupopacini.com.br')
    } catch (_) {
      user = new Record(users)
      user.setEmail('patricia@grupopacini.com.br')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Admin Pacini')
      app.save(user)
    }

    const depts = app.findCollectionByNameOrId('departments')
    const deptNames = ['Fiscal', 'Contábil', 'Departamento Pessoal', 'Legal']
    const deptRecords = []
    for (const name of deptNames) {
      try {
        const existing = app.findFirstRecordByData('departments', 'name', name)
        deptRecords.push(existing)
      } catch (_) {
        const r = new Record(depts)
        r.set('name', name)
        app.save(r)
        deptRecords.push(r)
      }
    }

    const clients = app.findCollectionByNameOrId('clients')
    const clientData = [
      { name: 'Tech Solutions Ltda', cnpj: '12.345.678/0001-90', tax_regime: 'Simples Nacional' },
      { name: 'Global Exports S.A.', cnpj: '98.765.432/0001-10', tax_regime: 'Lucro Real' },
      { name: 'Padaria Do João', cnpj: '11.222.333/0001-44', tax_regime: 'Lucro Presumido' },
    ]
    const clientRecords = []
    for (const data of clientData) {
      try {
        const existing = app.findFirstRecordByData('clients', 'cnpj', data.cnpj)
        clientRecords.push(existing)
      } catch (_) {
        const r = new Record(clients)
        r.set('name', data.name)
        r.set('cnpj', data.cnpj)
        r.set('tax_regime', data.tax_regime)
        app.save(r)
        clientRecords.push(r)
      }
    }

    const processes = app.findCollectionByNameOrId('processes')
    if (app.countRecords('processes') === 0) {
      const d = new Date()
      const tomorrow = new Date(d)
      tomorrow.setDate(d.getDate() + 1)
      const nextWeek = new Date(d)
      nextWeek.setDate(d.getDate() + 7)
      const lastWeek = new Date(d)
      lastWeek.setDate(d.getDate() - 7)

      const processData = [
        {
          title: 'Apuração ICMS Mensal',
          status: 'Pendente',
          due: tomorrow.toISOString().replace('T', ' '),
        },
        {
          title: 'Folha De Pagamento',
          status: 'Em Andamento',
          due: nextWeek.toISOString().replace('T', ' '),
        },
        {
          title: 'Alteração Contratual',
          status: 'Concluído',
          due: lastWeek.toISOString().replace('T', ' '),
        },
        {
          title: 'Declaração IRPJ',
          status: 'Atrasado',
          due: lastWeek.toISOString().replace('T', ' '),
        },
      ]

      for (let i = 0; i < processData.length; i++) {
        const p = new Record(processes)
        p.set('title', processData[i].title)
        p.set('status', processData[i].status)
        p.set('due_date', processData[i].due)
        p.set('client', clientRecords[i % clientRecords.length].id)
        p.set('department', deptRecords[i % deptRecords.length].id)
        p.set('responsible', user.id)
        app.save(p)
      }
    }
  },
  (app) => {},
)

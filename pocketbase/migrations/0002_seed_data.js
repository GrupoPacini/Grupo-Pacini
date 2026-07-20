migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'patricia@grupopacini.com.br')
    } catch (_) {
      user = new Record(usersCol)
      user.setEmail('patricia@grupopacini.com.br')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Admin Patricia')
      app.save(user)
    }

    const deptsCol = app.findCollectionByNameOrId('departments')
    const dNames = ['Fiscal', 'Contábil', 'Departamento Pessoal', 'Legal']
    const depts = []
    for (const name of dNames) {
      let d
      try {
        d = app.findFirstRecordByData('departments', 'name', name)
      } catch (_) {
        d = new Record(deptsCol)
        d.set('name', name)
        app.save(d)
      }
      depts.push(d)
    }

    const clientsCol = app.findCollectionByNameOrId('clients')
    const cData = [
      { name: 'Empresa Exemplo Alpha', cnpj: '11.111.111/0001-11', tax_regime: 'Simples Nacional' },
      { name: 'Comércio Beta Ltda', cnpj: '22.222.222/0001-22', tax_regime: 'Lucro Presumido' },
      { name: 'Serviços Gama S.A.', cnpj: '33.333.333/0001-33', tax_regime: 'Lucro Real' },
    ]
    const clients = []
    for (const c of cData) {
      let rec
      try {
        rec = app.findFirstRecordByData('clients', 'cnpj', c.cnpj)
      } catch (_) {
        rec = new Record(clientsCol)
        rec.set('name', c.name)
        rec.set('cnpj', c.cnpj)
        rec.set('tax_regime', c.tax_regime)
        app.save(rec)
      }
      clients.push(rec)
    }

    const processesCol = app.findCollectionByNameOrId('processes')
    try {
      app.findFirstRecordByData('processes', 'title', 'Fechamento Mensal - Exemplo Alpha')
    } catch (_) {
      const today = new Date()
      const past = new Date(today)
      past.setDate(past.getDate() - 2)
      const future = new Date(today)
      future.setDate(future.getDate() + 5)
      const farFuture = new Date(today)
      farFuture.setDate(farFuture.getDate() + 15)

      const p1 = new Record(processesCol)
      p1.set('title', 'Fechamento Mensal - Exemplo Alpha')
      p1.set('client', clients[0].id)
      p1.set('department', depts[1].id)
      p1.set('status', 'Em Andamento')
      p1.set('due_date', future.toISOString())
      p1.set('responsible', user.id)
      p1.set('notes', 'Aguardando envio dos extratos.')
      app.save(p1)

      const p2 = new Record(processesCol)
      p2.set('title', 'Apuração ICMS - Beta Ltda')
      p2.set('client', clients[1].id)
      p2.set('department', depts[0].id)
      p2.set('status', 'Atrasado')
      p2.set('due_date', past.toISOString())
      p2.set('responsible', user.id)
      app.save(p2)

      const p3 = new Record(processesCol)
      p3.set('title', 'Folha de Pagamento - Gama S.A.')
      p3.set('client', clients[2].id)
      p3.set('department', depts[2].id)
      p3.set('status', 'Concluído')
      p3.set('due_date', farFuture.toISOString())
      p3.set('responsible', user.id)
      app.save(p3)

      const p4 = new Record(processesCol)
      p4.set('title', 'Alteração Contratual')
      p4.set('client', clients[0].id)
      p4.set('department', depts[3].id)
      p4.set('status', 'Pendente')
      p4.set('due_date', future.toISOString())
      p4.set('responsible', user.id)
      app.save(p4)
    }
  },
  (app) => {
    // Empty down migration
  },
)

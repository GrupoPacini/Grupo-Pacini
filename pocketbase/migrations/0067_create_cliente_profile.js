migrate(
  (app) => {
    var profilesCol = app.findCollectionByNameOrId('access_profiles')

    var clientePerms = {
      Dashboard: ['visualizar'],
      Clientes: [],
      Processos: [],
      Licenças: [],
      Renovações: [],
      Playbooks: [],
      'Assistente IA': ['utilizar'],
      Configurações: [],
      'Gestão de Usuários': [],
      'Perfis de Acesso': [],
      Auditoria: [],
      Integrações: [],
      'Preferências do Sistema': [],
      Segurança: [],
      'Relatório Financeiro': ['visualizar'],
    }

    try {
      var existing = app.findFirstRecordByData('access_profiles', 'name', 'Cliente')
      existing.set(
        'description',
        'Perfil de acesso para usuários do tipo Cliente. Permite visualização do Relatório Financeiro.',
      )
      existing.set('status', 'active')
      existing.set('system', true)
      existing.set('permissions', clientePerms)
      app.save(existing)
    } catch (_) {
      var cliente = new Record(profilesCol)
      cliente.set('name', 'Cliente')
      cliente.set(
        'description',
        'Perfil de acesso para usuários do tipo Cliente. Permite visualização do Relatório Financeiro.',
      )
      cliente.set('status', 'active')
      cliente.set('system', true)
      cliente.set('permissions', clientePerms)
      app.save(cliente)
    }
  },
  (app) => {
    try {
      var record = app.findFirstRecordByData('access_profiles', 'name', 'Cliente')
      app.delete(record)
    } catch (_) {}
  },
)

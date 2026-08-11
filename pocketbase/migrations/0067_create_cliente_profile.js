migrate(
  (app) => {
    var profilesCol = app.findCollectionByNameOrId('access_profiles')

    try {
      app.findFirstRecordByData('access_profiles', 'name', 'Cliente')
    } catch (_) {
      var cliente = new Record(profilesCol)
      cliente.set('name', 'Cliente')
      cliente.set(
        'description',
        'Perfil de acesso para usuários do tipo Cliente. Permite visualização do Relatório Financeiro.',
      )
      cliente.set('status', 'active')
      cliente.set('system', true)
      cliente.set('permissions', {
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
      })
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

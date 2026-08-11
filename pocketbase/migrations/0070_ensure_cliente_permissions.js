migrate(
  (app) => {
    var clientePerms = {
      Dashboard: ['visualizar'],
      'Relatório Financeiro': ['visualizar'],
      Clientes: [],
      Processos: [],
      'Modelos de Processo': [],
      Licenças: [],
      Renovações: [],
      Playbooks: [],
      'Assistente IA': [],
      Configurações: [],
      'Gestão de Usuários': [],
      'Perfis de Acesso': [],
      Auditoria: [],
      Integrações: [],
      'Preferências do Sistema': [],
      Segurança: [],
    }

    try {
      var cliente = app.findFirstRecordByData('access_profiles', 'name', 'Cliente')
      cliente.set('permissions', clientePerms)
      cliente.set('status', 'active')
      cliente.set('system', true)
      app.save(cliente)
    } catch (_) {}
  },
  (app) => {},
)

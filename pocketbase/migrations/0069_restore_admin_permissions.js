migrate(
  (app) => {
    var adminPerms = {
      Dashboard: ['visualizar'],
      Clientes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Processos: ['visualizar', 'criar', 'editar', 'excluir', 'concluir', 'exportar', 'gerenciar'],
      'Modelos de Processo': ['visualizar', 'gerenciar'],
      Licenças: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Renovações: ['visualizar', 'criar', 'editar', 'exportar', 'gerenciar'],
      'Relatório Financeiro': ['visualizar', 'importar', 'substituir', 'excluir'],
      Playbooks: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      'Assistente IA': ['utilizar'],
      Configurações: ['acessar'],
      'Gestão de Usuários': ['visualizar', 'criar', 'editar', 'excluir'],
      'Perfis de Acesso': ['visualizar', 'criar', 'editar', 'excluir'],
      Auditoria: ['visualizar', 'exportar'],
      Integrações: ['visualizar', 'criar', 'editar', 'excluir'],
      'Preferências do Sistema': ['visualizar', 'editar'],
      Segurança: ['visualizar', 'editar', 'gerenciar'],
    }

    try {
      var adminProfile = app.findFirstRecordByData('access_profiles', 'name', 'Administrador')
      adminProfile.set('permissions', adminPerms)
      adminProfile.set('status', 'active')
      adminProfile.set('system', true)
      app.save(adminProfile)
    } catch (_) {}
  },
  (app) => {},
)

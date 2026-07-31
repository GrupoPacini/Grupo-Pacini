migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('access_profiles')

    if (!col.fields.getByName('permissions')) {
      col.fields.add(new JSONField({ name: 'permissions' }))
      app.save(col)
    }

    var adminPerms = {
      Dashboard: ['visualizar'],
      Clientes: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Processos: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Licenças: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
      Renovações: ['visualizar', 'criar', 'editar', 'exportar', 'gerenciar'],
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

    var colaboradorPerms = {
      Dashboard: ['visualizar'],
      Clientes: ['visualizar'],
      Processos: ['visualizar'],
      Licenças: ['visualizar'],
      Renovações: ['visualizar'],
      Playbooks: ['visualizar'],
      'Assistente IA': ['utilizar'],
      Configurações: [],
      'Gestão de Usuários': [],
      'Perfis de Acesso': [],
      Auditoria: [],
      Integrações: [],
      'Preferências do Sistema': [],
      Segurança: [],
    }

    try {
      var admin = app.findFirstRecordByData('access_profiles', 'name', 'Administrador')
      if (!admin.get('permissions')) {
        admin.set('permissions', adminPerms)
        app.save(admin)
      }
    } catch (_) {}

    try {
      var colaborador = app.findFirstRecordByData('access_profiles', 'name', 'Colaborador')
      if (!colaborador.get('permissions')) {
        colaborador.set('permissions', colaboradorPerms)
        app.save(colaborador)
      }
    } catch (_) {}
  },
  (app) => {
    var col = app.findCollectionByNameOrId('access_profiles')
    var field = col.fields.getByName('permissions')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)

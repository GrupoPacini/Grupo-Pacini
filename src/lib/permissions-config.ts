export type Permissions = Record<string, string[]>

export interface ModuleConfig {
  module: string
  actions: string[]
}

export const MODULE_CONFIGS: ModuleConfig[] = [
  { module: 'Dashboard', actions: ['visualizar'] },
  {
    module: 'Clientes',
    actions: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
  },
  {
    module: 'Processos',
    actions: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
  },
  {
    module: 'Licenças',
    actions: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
  },
  { module: 'Renovações', actions: ['visualizar', 'criar', 'editar', 'exportar', 'gerenciar'] },
  {
    module: 'Playbooks',
    actions: ['visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerenciar'],
  },
  { module: 'Assistente IA', actions: ['utilizar'] },
  { module: 'Configurações', actions: ['acessar'] },
  { module: 'Gestão de Usuários', actions: ['visualizar', 'criar', 'editar', 'excluir'] },
  { module: 'Perfis de Acesso', actions: ['visualizar', 'criar', 'editar', 'excluir'] },
  { module: 'Auditoria', actions: ['visualizar', 'exportar'] },
  { module: 'Integrações', actions: ['visualizar', 'criar', 'editar', 'excluir'] },
  { module: 'Preferências do Sistema', actions: ['visualizar', 'editar'] },
  { module: 'Segurança', actions: ['visualizar', 'editar', 'gerenciar'] },
]

export const LOCKED_ADMIN_MODULES = [
  'Configurações',
  'Gestão de Usuários',
  'Perfis de Acesso',
  'Segurança',
]

export function normalizePermissions(raw: unknown): Permissions {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result: Permissions = {}
  const obj = raw as Record<string, unknown>
  for (const [key, val] of Object.entries(obj)) {
    if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
      result[key] = val
    }
  }
  return result
}

import type { Permissions } from '@/lib/permissions-config'

export function can(
  permissions: Permissions | null,
  module: string,
  action: string,
  isAdmin: boolean = false,
): boolean {
  if (isAdmin) return true
  if (!permissions) return false
  const actions = permissions[module]
  if (!Array.isArray(actions)) return false
  return actions.includes(action)
}

export function canViewModule(
  permissions: Permissions | null,
  module: string,
  isAdmin: boolean = false,
): boolean {
  if (isAdmin) return true
  if (!permissions) return false
  const actions = permissions[module]
  return Array.isArray(actions) && actions.length > 0
}

export function getModuleFromPath(pathname: string): string | null {
  if (pathname.startsWith('/configuracoes/usuarios')) return 'Gestão de Usuários'
  if (pathname.startsWith('/configuracoes/perfis')) return 'Perfis de Acesso'
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/processos') return 'Processos'
  if (pathname === '/clientes' || pathname.startsWith('/clientes/')) return 'Clientes'
  if (pathname === '/licencas') return 'Licenças'
  if (pathname === '/renovacoes') return 'Renovações'
  if (pathname === '/playbooks') return 'Playbooks'
  if (pathname === '/chat') return 'Assistente IA'
  if (pathname === '/relatorio-financeiro') return 'Relatório Financeiro'
  if (pathname === '/configuracoes') return 'Configurações'
  return null
}

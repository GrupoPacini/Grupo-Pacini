import { differenceInDays } from 'date-fns'

export const PRIORIDADES = ['Baixa', 'Média', 'Alta']
export const LICENSE_STATUS = ['Ativo', 'Expirado', 'Renovando']
export const STATUS_OPERACIONAL = [
  'Regular',
  'Em Atenção',
  'Próxima Vencimento',
  'Vencida',
  'Sem Vencimento Informado',
  'Em Renovação',
  'Aguardando Cliente',
  'Em Análise Órgão',
  'Com Exigência',
  'Concluída',
]
export const ETAPAS_RENOVACAO = [
  'Protocolado',
  'Em Análise Órgão',
  'Aguardando Cliente',
  'Pendente Documentação',
  'Concluída',
]

export const RENEWAL_OPERATIONAL_STATUSES = [
  'Em Renovação',
  'Aguardando Cliente',
  'Em Análise Órgão',
  'Com Exigência',
  'Em Atenção',
]

export function isRenewalStatus(statusOperacional: string | undefined | null): boolean {
  return !!statusOperacional && RENEWAL_OPERATIONAL_STATUSES.includes(statusOperacional)
}

export function getDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function statusOperacionalBadge(status: string) {
  const map: Record<string, string> = {
    Regular:
      'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    'Em Atenção':
      'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    'Próxima Vencimento':
      'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    Vencida:
      'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    'Sem Vencimento Informado':
      'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
    'Em Renovação':
      'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'Aguardando Cliente':
      'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    'Em Análise Órgão':
      'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
    'Com Exigência':
      'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    Concluída:
      'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  }
  return (
    map[status] ||
    'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
  )
}

export function etapaRenovacaoBadge(etapa: string) {
  const map: Record<string, string> = {
    Protocolado:
      'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'Em Análise Órgão':
      'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
    'Aguardando Cliente':
      'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    'Pendente Documentação':
      'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
    Concluída:
      'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  }
  return (
    map[etapa] ||
    'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
  )
}

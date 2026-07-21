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

export function getDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function statusOperacionalBadge(status: string) {
  const map: Record<string, string> = {
    Regular: 'bg-green-100 text-green-700 border-green-300',
    'Em Atenção': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Próxima Vencimento': 'bg-orange-100 text-orange-700 border-orange-300',
    Vencida: 'bg-red-100 text-red-700 border-red-300',
    'Sem Vencimento Informado': 'bg-gray-100 text-gray-600 border-gray-300',
    'Em Renovação': 'bg-blue-100 text-blue-700 border-blue-300',
    'Aguardando Cliente': 'bg-purple-100 text-purple-700 border-purple-300',
    'Em Análise Órgão': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    'Com Exigência': 'bg-red-100 text-red-700 border-red-300',
    Concluída: 'bg-green-100 text-green-700 border-green-300',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-300'
}

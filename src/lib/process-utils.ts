export const PROCESS_STATUSES = [
  'Não iniciado',
  'Em andamento',
  'Aguardando cliente',
  'Aguardando terceiro',
  'Pausado',
  'Concluído',
  'Cancelado',
] as const

export const PROCESS_PRIORITIES = ['Baixa', 'Média', 'Alta'] as const

export const STAGE_STATUSES = ['Não iniciado', 'Em andamento', 'Concluído'] as const

export const TASK_STATUSES = ['Pendente', 'Em andamento', 'Concluída'] as const

export function processStatusBadge(status: string): string {
  const map: Record<string, string> = {
    'Não iniciado': 'bg-gray-100 text-gray-700 border-gray-200',
    'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
    'Aguardando cliente': 'bg-amber-50 text-amber-700 border-amber-200',
    'Aguardando terceiro': 'bg-orange-50 text-orange-700 border-orange-200',
    Pausado: 'bg-purple-50 text-purple-700 border-purple-200',
    Concluído: 'bg-green-50 text-green-700 border-green-200',
    Cancelado: 'bg-red-50 text-red-700 border-red-200',
  }
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function stageStatusBadge(status: string): string {
  const map: Record<string, string> = {
    'Não iniciado': 'bg-gray-100 text-gray-700 border-gray-200',
    'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
    Concluído: 'bg-green-50 text-green-700 border-green-200',
  }
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function taskStatusBadge(status: string): string {
  const map: Record<string, string> = {
    Pendente: 'bg-gray-100 text-gray-700 border-gray-200',
    'Em andamento': 'bg-blue-50 text-blue-700 border-blue-200',
    Concluída: 'bg-green-50 text-green-700 border-green-200',
  }
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function priorityBadge(priority: string): string {
  const map: Record<string, string> = {
    Baixa: 'bg-gray-100 text-gray-700 border-gray-200',
    Média: 'bg-amber-50 text-amber-700 border-amber-200',
    Alta: 'bg-red-50 text-red-700 border-red-200',
  }
  return map[priority] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function isProcessActive(status: string): boolean {
  return !['Não iniciado', 'Concluído', 'Cancelado'].includes(status)
}

export function isProcessDelayed(status: string, dueDate: string): boolean {
  if (['Concluído', 'Cancelado'].includes(status)) return false
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

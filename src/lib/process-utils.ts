import type { ProcessStage } from '@/services/process-stages'

export const PROCESS_STATUSES = [
  'Não iniciado',
  'Em andamento',
  'Aguardando cliente',
  'Aguardando terceiro',
  'Pausado',
  'Concluído',
  'Cancelado',
] as const

export const STAGE_STATUSES = ['Não iniciado', 'Em andamento', 'Concluído'] as const

export const TASK_STATUSES = ['Pendente', 'Em andamento', 'Concluída'] as const

export const PRIORITIES = ['Baixa', 'Média', 'Alta'] as const

export function computeProgress(stages: ProcessStage[]): number {
  let total = 0
  let completed = 0
  for (const stage of stages) {
    const tasks = stage.expand?.process_tasks || []
    total += tasks.length
    completed += tasks.filter((t) => t.status === 'Concluída').length
  }
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDate) < today
}

export function isActiveStatus(status: string): boolean {
  return status !== 'Concluído' && status !== 'Cancelado'
}

export function processStatusBadge(status: string): string {
  switch (status) {
    case 'Concluído':
      return 'bg-green-100 text-green-700 border-green-300'
    case 'Cancelado':
      return 'bg-red-100 text-red-700 border-red-300'
    case 'Em andamento':
      return 'bg-blue-100 text-blue-700 border-blue-300'
    case 'Pausado':
      return 'bg-amber-100 text-amber-700 border-amber-300'
    case 'Aguardando cliente':
      return 'bg-purple-100 text-purple-700 border-purple-300'
    case 'Aguardando terceiro':
      return 'bg-cyan-100 text-cyan-700 border-cyan-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

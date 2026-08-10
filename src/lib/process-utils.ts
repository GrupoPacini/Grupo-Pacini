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

export const STAGE_STATUSES = [
  'Não iniciada',
  'Em andamento',
  'Aguardando cliente',
  'Aguardando terceiro',
  'Bloqueada',
  'Concluída',
  'Não aplicável',
] as const

export const TASK_STATUSES = [
  'Pendente',
  'Em andamento',
  'Aguardando cliente',
  'Aguardando terceiro',
  'Bloqueada',
  'Concluída',
  'Não aplicável',
] as const
export const PRIORITIES = ['Baixa', 'Média', 'Alta'] as const
export const TASK_PRIORITIES = ['Baixa', 'Normal', 'Alta', 'Urgente'] as const

export const TASK_DEADLINE_BASES = [
  { value: 'stage_start', label: 'Início da etapa' },
  { value: 'previous_task_completion', label: 'Conclusão da tarefa anterior' },
  { value: 'dependent_tasks_completion', label: 'Conclusão das tarefas dependentes' },
] as const

export const START_MODES = [
  { value: 'manual', label: 'Manual' },
  { value: 'auto_after_previous', label: 'Automaticamente após conclusão da etapa anterior' },
  {
    value: 'auto_after_dependencies',
    label: 'Automaticamente quando todas as dependências forem concluídas',
  },
] as const

export const COMPLETION_MODES = [
  { value: 'manual', label: 'Manualmente' },
  { value: 'all_required_tasks', label: 'Todas as tarefas obrigatórias forem concluídas' },
  { value: 'all_tasks', label: 'Todas as tarefas forem concluídas' },
] as const

export const DEADLINE_BASES = [
  { value: 'process_start', label: 'Data de início do processo' },
  { value: 'previous_stage_completion', label: 'Conclusão da etapa anterior' },
  { value: 'own_stage_start', label: 'Início da própria etapa' },
] as const

export const FIELD_TYPES = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'data', label: 'Data' },
  { value: 'sim_nao', label: 'Sim/Não' },
  { value: 'lista_opcoes', label: 'Lista de opções' },
  { value: 'observacao_longa', label: 'Observação longa' },
] as const

export const STAGE_COLLECTIONS = {
  process: {
    stages: 'process_stages',
    tasks: 'process_tasks',
    checklists: 'process_task_checklists',
    customFields: 'process_stage_custom_fields',
    observations: 'process_stage_observations',
  },
  model: {
    stages: 'process_model_stages',
    tasks: 'process_model_tasks',
    checklists: 'process_model_task_checklists',
    customFields: 'process_model_stage_custom_fields',
    observations: 'process_model_stage_observations',
  },
} as const

export function computeProgress(stages: ProcessStage[]): number {
  let total = 0,
    completed = 0
  for (const stage of stages) {
    if (stage.active === false) continue
    const tasks = stage.expand?.process_tasks || []
    for (const t of tasks) {
      if (t.status === 'Não aplicável') continue
      if (t.required === 'não') continue
      if (t.active === false) continue
      total++
      if (t.status === 'Concluída') completed++
    }
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

export function stageStatusBadge(status: string): string {
  switch (status) {
    case 'Concluída':
      return 'bg-green-50 text-green-700 border-green-300'
    case 'Em andamento':
      return 'bg-blue-50 text-blue-700 border-blue-300'
    case 'Aguardando cliente':
      return 'bg-purple-50 text-purple-700 border-purple-300'
    case 'Aguardando terceiro':
      return 'bg-cyan-50 text-cyan-700 border-cyan-300'
    case 'Bloqueada':
      return 'bg-red-50 text-red-700 border-red-300'
    case 'Não aplicável':
      return 'bg-gray-50 text-gray-500 border-gray-300'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-300'
  }
}

export function isStageBlocked(stage: ProcessStage, allStages: ProcessStage[]): boolean {
  const deps = stage.dependencies
  if (!deps || deps.length === 0) return false
  return deps.some((depId) => {
    const dep = allStages.find((s) => s.id === depId)
    return !dep || dep.status !== 'Concluída'
  })
}

export function getBlockingStages(stage: ProcessStage, allStages: ProcessStage[]): ProcessStage[] {
  const deps = stage.dependencies
  if (!deps || deps.length === 0) return []
  return deps
    .map((depId) => allStages.find((s) => s.id === depId))
    .filter((s): s is ProcessStage => !!s && s.status !== 'Concluída')
}

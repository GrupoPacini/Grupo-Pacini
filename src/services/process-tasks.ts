import pb from '@/lib/pocketbase/client'
import type { User } from './api'
import type { ProcessTaskChecklist } from './process-task-checklists'

export interface ProcessTask {
  id: string
  stage: string
  name: string
  description: string
  responsible: string
  due_date: string
  due_days: number | null
  status: string
  observation: string
  priority: string
  required: string
  order: number
  dependency: string[]
  active: boolean
  deadline_basis: string
  created: string
  updated: string
  expand?: {
    responsible?: User
    dependency?: ProcessTask[]
    process_task_checklists?: ProcessTaskChecklist[]
  }
}

export const getTasksByStage = (stageId: string) =>
  pb.collection<ProcessTask>('process_tasks').getFullList({
    filter: `stage = '${stageId}'`,
    sort: 'order',
    expand: 'responsible,dependency',
  })

export const createTask = (data: {
  stage: string
  name: string
  description?: string
  responsible?: string | null
  due_date?: string | null
  due_days?: number | null
  status: string
  observation?: string
  priority?: string
  required?: string
  order?: number
  dependency?: string[]
  active?: boolean
  deadline_basis?: string
}) => pb.collection('process_tasks').create(data)

export const updateTask = (
  id: string,
  data: Partial<{
    name: string
    description: string
    responsible: string | null
    due_date: string | null
    due_days: number | null
    status: string
    observation: string
    priority: string
    required: string
    order: number
    dependency: string[]
    active: boolean
    deadline_basis: string
  }>,
) => pb.collection('process_tasks').update(id, data)

export const deleteTask = (id: string) => pb.collection('process_tasks').delete(id)

export const duplicateTask = async (taskId: string): Promise<ProcessTask> => {
  const original = await pb
    .collection<ProcessTask>('process_tasks')
    .getOne(taskId, { expand: 'responsible' })
  const allTasks = await getTasksByStage(original.stage)
  const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map((t) => t.order || 0)) + 1 : 0
  return pb.collection<ProcessTask>('process_tasks').create({
    stage: original.stage,
    name: `${original.name} (cópia)`,
    description: original.description || '',
    responsible: original.responsible || null,
    due_date: original.due_date || null,
    due_days: original.due_days ?? null,
    status: 'Pendente',
    observation: original.observation || '',
    priority: original.priority || 'Baixa',
    required: original.required || 'não',
    order: maxOrder,
    dependency: [],
    active: true,
    deadline_basis: original.deadline_basis || 'stage_start',
  })
}

import pb from '@/lib/pocketbase/client'
import type { ProcessTask } from './process-tasks'
import type { DepartmentRecord } from './departments'
import type { UserRecord } from './users'

export interface ProcessStage {
  id: string
  process: string
  name: string
  order: number
  status: string
  description: string
  default_responsible: string | null
  department: string | null
  default_due_days: number | null
  priority: string
  identification_color: string
  required: string
  active: boolean
  dependencies: string[]
  start_mode: string
  completion_mode: string
  deadline_basis: string
  created: string
  updated: string
  expand?: {
    process_tasks?: ProcessTask[]
    default_responsible?: UserRecord
    department?: DepartmentRecord
  }
}

export const getStagesByProcess = (processId: string) =>
  pb.collection<ProcessStage>('process_stages').getFullList({
    filter: `process = '${processId}'`,
    sort: 'order',
    expand:
      'process_tasks.responsible,process_tasks.process_task_checklists,default_responsible,department',
  })

export const getAllStages = () =>
  pb.collection<ProcessStage>('process_stages').getFullList({
    sort: 'order',
    expand: 'process_tasks',
  })

export const createStage = (data: {
  process: string
  name: string
  order?: number
  status?: string
  description?: string
  default_responsible?: string | null
  department?: string | null
  default_due_days?: number | null
  priority?: string
  identification_color?: string
  required?: string
  active?: boolean
  dependencies?: string[]
  start_mode?: string
  completion_mode?: string
  deadline_basis?: string
}) => pb.collection('process_stages').create(data)

export const updateStage = (
  id: string,
  data: Partial<{
    name: string
    order: number
    status: string
    description: string
    default_responsible: string | null
    department: string | null
    default_due_days: number | null
    priority: string
    identification_color: string
    required: string
    active: boolean
    dependencies: string[]
    start_mode: string
    completion_mode: string
    deadline_basis: string
  }>,
) => pb.collection('process_stages').update(id, data)

export const deleteStage = (id: string) => pb.collection('process_stages').delete(id)

export const duplicateStage = async (stageId: string, processId: string): Promise<ProcessStage> => {
  const original = await pb.collection<ProcessStage>('process_stages').getOne(stageId)
  const allStages = await getStagesByProcess(processId)
  const maxOrder = allStages.length > 0 ? Math.max(...allStages.map((s) => s.order || 0)) + 1 : 0
  return pb.collection<ProcessStage>('process_stages').create({
    process: processId,
    name: `${original.name} (cópia)`,
    order: maxOrder,
    status: 'Não iniciada',
    description: original.description || '',
    default_responsible: original.default_responsible || null,
    department: original.department || null,
    default_due_days: original.default_due_days ?? null,
    priority: original.priority || 'Média',
    identification_color: original.identification_color || '',
    required: original.required || 'não',
    active: original.active !== false,
    dependencies: [],
    start_mode: original.start_mode || 'manual',
    completion_mode: original.completion_mode || 'manual',
    deadline_basis: original.deadline_basis || 'process_start',
  })
}

export const toggleStageActive = async (id: string, active: boolean) =>
  pb.collection('process_stages').update(id, { active })

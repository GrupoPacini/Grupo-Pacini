import pb from '@/lib/pocketbase/client'

export interface ProcessStage {
  id: string
  process: string
  name: string
  order: number
  status: string
  created: string
  updated: string
}

export interface ProcessTask {
  id: string
  stage: string
  name: string
  responsible: string
  due_date: string
  status: string
  observation: string
  created: string
  updated: string
  expand?: {
    responsible?: { id: string; name: string }
  }
}

export const getAllStages = () =>
  pb.collection<ProcessStage>('process_stages').getFullList({ sort: 'order' })

export const getStagesByProcess = (processId: string) =>
  pb.collection<ProcessStage>('process_stages').getFullList({
    filter: `process = '${processId}'`,
    sort: 'order',
  })

export const createStage = (data: {
  process: string
  name: string
  order: number
  status: string
}) => pb.collection('process_stages').create(data)

export const updateStage = (
  id: string,
  data: Partial<{ name: string; order: number; status: string }>,
) => pb.collection('process_stages').update(id, data)

export const deleteStage = (id: string) => pb.collection('process_stages').delete(id)

export const getAllTasks = () =>
  pb
    .collection<ProcessTask>('process_tasks')
    .getFullList({ sort: 'created', expand: 'responsible' })

export const createTask = (data: {
  stage: string
  name: string
  responsible: string
  due_date: string
  status: string
  observation: string
}) => pb.collection('process_tasks').create(data)

export const updateTask = (
  id: string,
  data: Partial<{
    name: string
    responsible: string
    due_date: string
    status: string
    observation: string
  }>,
) => pb.collection('process_tasks').update(id, data)

export const deleteTask = (id: string) => pb.collection('process_tasks').delete(id)

export function computeProgress(tasks: ProcessTask[]): number {
  if (tasks.length === 0) return 0
  const concluded = tasks.filter((t) => t.status === 'Concluída').length
  return Math.round((concluded / tasks.length) * 100)
}

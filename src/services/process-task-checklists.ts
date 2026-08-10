import pb from '@/lib/pocketbase/client'

export interface ProcessTaskChecklist {
  id: string
  task: string
  description: string
  completed: boolean
  order: number
  created: string
  updated: string
}

export const getChecklistsByTask = (taskId: string) =>
  pb.collection<ProcessTaskChecklist>('process_task_checklists').getFullList({
    filter: `task = '${taskId}'`,
    sort: 'order',
  })

export const createChecklistItem = (data: {
  task: string
  description: string
  completed?: boolean
  order?: number
}) => pb.collection<ProcessTaskChecklist>('process_task_checklists').create(data)

export const updateChecklistItem = (
  id: string,
  data: Partial<{
    description: string
    completed: boolean
    order: number
  }>,
) => pb.collection<ProcessTaskChecklist>('process_task_checklists').update(id, data)

export const deleteChecklistItem = (id: string) =>
  pb.collection<ProcessTaskChecklist>('process_task_checklists').delete(id)

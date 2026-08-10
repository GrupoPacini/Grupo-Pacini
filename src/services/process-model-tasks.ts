import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/services/users'

export interface ProcessModelTask {
  id: string
  stage: string
  name: string
  description: string
  default_due_days: number
  default_responsible: string
  required: 'sim' | 'não'
  order: number
  created: string
  updated: string
  expand?: {
    default_responsible?: UserRecord
  }
}

export const getTasksByModelStage = (stageId: string) =>
  pb.collection<ProcessModelTask>('process_model_tasks').getFullList({
    filter: `stage = '${stageId}'`,
    sort: 'order',
    expand: 'default_responsible',
  })

export const createModelTask = (data: {
  stage: string
  name: string
  description?: string
  default_due_days?: number
  default_responsible?: string
  required?: string
  order: number
}) => pb.collection('process_model_tasks').create(data)

export const updateModelTask = (
  id: string,
  data: Partial<{
    name: string
    description: string
    default_due_days: number
    default_responsible: string
    required: string
    order: number
  }>,
) => pb.collection('process_model_tasks').update(id, data)

export const deleteModelTask = (id: string) => pb.collection('process_model_tasks').delete(id)

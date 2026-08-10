import pb from '@/lib/pocketbase/client'
import type { ProcessModelTask } from '@/services/process-model-tasks'

export interface ProcessModelStage {
  id: string
  model: string
  name: string
  order: number
  description: string
  created: string
  updated: string
  expand?: {
    process_model_tasks?: ProcessModelTask[]
  }
}

export const getStagesByModel = (modelId: string) =>
  pb.collection<ProcessModelStage>('process_model_stages').getFullList({
    filter: `model = '${modelId}'`,
    sort: 'order',
    expand: 'process_model_tasks.default_responsible',
  })

export const getAllModelStages = () =>
  pb.collection<ProcessModelStage>('process_model_stages').getFullList({
    sort: 'order',
    expand: 'process_model_tasks',
  })

export const createModelStage = (data: {
  model: string
  name: string
  order: number
  description?: string
}) => pb.collection('process_model_stages').create(data)

export const updateModelStage = (
  id: string,
  data: Partial<{ name: string; order: number; description: string }>,
) => pb.collection('process_model_stages').update(id, data)

export const deleteModelStage = (id: string) => pb.collection('process_model_stages').delete(id)

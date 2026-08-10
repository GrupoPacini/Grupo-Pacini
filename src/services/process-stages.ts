import pb from '@/lib/pocketbase/client'
import type { ProcessTask } from './process-tasks'

export interface ProcessStage {
  id: string
  process: string
  name: string
  order: number
  status: string
  created: string
  updated: string
  expand?: {
    process_tasks?: ProcessTask[]
  }
}

export const getStagesByProcess = (processId: string) =>
  pb.collection<ProcessStage>('process_stages').getFullList({
    filter: `process = '${processId}'`,
    sort: 'order',
    expand: 'process_tasks.responsible',
  })

export const getAllStages = () =>
  pb.collection<ProcessStage>('process_stages').getFullList({
    sort: 'order',
    expand: 'process_tasks',
  })

export const createStage = (data: {
  process: string
  name: string
  order: number
  status?: string
}) => pb.collection('process_stages').create(data)

export const updateStage = (
  id: string,
  data: Partial<{ name: string; order: number; status: string }>,
) => pb.collection('process_stages').update(id, data)

export const deleteStage = (id: string) => pb.collection('process_stages').delete(id)

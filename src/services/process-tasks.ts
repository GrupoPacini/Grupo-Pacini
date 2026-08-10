import pb from '@/lib/pocketbase/client'
import type { User } from './api'

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
    responsible?: User
  }
}

export const getTasksByStage = (stageId: string) =>
  pb.collection<ProcessTask>('process_tasks').getFullList({
    filter: `stage = '${stageId}'`,
    sort: 'created',
    expand: 'responsible',
  })

export const createTask = (data: {
  stage: string
  name: string
  responsible?: string
  due_date?: string
  status: string
  observation?: string
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

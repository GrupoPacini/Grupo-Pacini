import pb from '@/lib/pocketbase/client'
import type { DepartmentRecord } from '@/services/departments'
import type { UserRecord } from '@/services/users'

export interface ProcessModel {
  id: string
  name: string
  description: string
  department: string
  type: 'eventual' | 'recorrente'
  status: 'ativo' | 'inativo'
  created_by: string
  created: string
  updated: string
  expand?: {
    department?: DepartmentRecord
    created_by?: UserRecord
  }
}

export const getModels = () =>
  pb.collection<ProcessModel>('process_models').getFullList({
    sort: '-created',
    expand: 'department,created_by',
  })

export const getActiveModels = () =>
  pb.collection<ProcessModel>('process_models').getFullList({
    filter: 'status = "ativo"',
    sort: 'name',
  })

export const getModel = (id: string) =>
  pb.collection<ProcessModel>('process_models').getOne(id, { expand: 'department,created_by' })

export const createModel = (data: {
  name: string
  description?: string
  department?: string
  type: string
  status: string
  created_by?: string
}) => pb.collection('process_models').create(data)

export const updateModel = (
  id: string,
  data: Partial<{
    name: string
    description: string
    department: string
    type: string
    status: string
  }>,
) => pb.collection('process_models').update(id, data)

export const deleteModel = (id: string) => pb.collection('process_models').delete(id)

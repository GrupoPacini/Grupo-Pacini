import pb from '@/lib/pocketbase/client'

export interface DepartmentRecord {
  id: string
  name: string
  created: string
  updated: string
}

export const getDepartments = () =>
  pb.collection<DepartmentRecord>('departments').getFullList({ sort: 'name' })

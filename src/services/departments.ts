import pb from '@/lib/pocketbase/client'

export interface DepartmentRecord {
  id: string
  name: string
}

export const getDepartments = () =>
  pb.collection<DepartmentRecord>('departments').getFullList({ sort: 'name' })

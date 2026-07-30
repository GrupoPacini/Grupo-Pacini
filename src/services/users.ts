import pb from '@/lib/pocketbase/client'

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  created: string
  updated: string
}

export const getUsers = () => pb.collection<UserRecord>('users').getFullList({ sort: 'name' })

export const updateUserRole = (id: string, role: 'admin' | 'colaborador') =>
  pb.collection('users').update(id, { role })

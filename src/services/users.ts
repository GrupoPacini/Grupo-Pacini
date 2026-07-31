import pb from '@/lib/pocketbase/client'
import type { DepartmentRecord } from '@/services/departments'
import type { AccessProfileRecord } from '@/services/access-profiles'

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  status: string
  department: string | null
  access_profile: string | null
  last_access: string | null
  avatar: string
  created: string
  updated: string
  expand?: {
    department?: DepartmentRecord
    access_profile?: AccessProfileRecord
  }
}

export const getUsers = () =>
  pb.collection<UserRecord>('users').getFullList({
    sort: 'name',
    expand: 'department,access_profile',
  })

export const updateUserRole = (id: string, role: 'admin' | 'colaborador') =>
  pb.collection('users').update(id, { role })

export const updateUserStatus = (id: string, status: string) =>
  pb.collection('users').update(id, { status })

export const updateUser = (
  id: string,
  data: {
    name?: string
    email?: string
    department?: string | null
    access_profile?: string | null
  },
) => pb.collection('users').update(id, data)

export const updateUserProfile = (id: string, access_profile: string) =>
  pb.collection('users').update(id, { access_profile })

export const createUser = (data: {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role: 'admin' | 'colaborador'
  department?: string | null
  access_profile?: string | null
  status?: string
}) => pb.collection('users').create(data)

export const requestPasswordReset = (email: string) =>
  pb.collection('users').requestPasswordReset(email)

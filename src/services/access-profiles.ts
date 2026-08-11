import pb from '@/lib/pocketbase/client'

export type Permissions = Record<string, string[]>

export interface AccessProfileRecord {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  system: boolean
  permissions: Permissions | null
  created_by: string | null
  created: string
  updated: string
}

export const getAccessProfiles = () =>
  pb.collection<AccessProfileRecord>('access_profiles').getFullList({
    sort: 'name',
    expand: 'created_by',
  })

export const getActiveAccessProfiles = () =>
  pb.collection<AccessProfileRecord>('access_profiles').getFullList({
    filter: 'status = "active"',
    sort: 'name',
  })

export const createAccessProfile = (data: {
  name: string
  description?: string
  status: 'active' | 'inactive'
  created_by?: string | null
  permissions?: Record<string, string[]>
}) =>
  pb.collection('access_profiles').create({
    permissions: {},
    system: false,
    ...data,
  })

export const updateAccessProfile = (
  id: string,
  data: {
    name?: string
    description?: string
    status?: 'active' | 'inactive'
    permissions?: Permissions
  },
) => pb.collection('access_profiles').update(id, data)

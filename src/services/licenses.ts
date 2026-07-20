import pb from '@/lib/pocketbase/client'

export interface License {
  id: string
  client: string
  name: string
  type: string
  expiration_date: string
  document: string
  status: string
  expand?: { client?: { id: string; name: string } }
  created: string
  updated: string
}

export const getLicenses = () =>
  pb.collection<License>('licenses').getFullList({ expand: 'client', sort: 'expiration_date' })

export const createLicense = (data: FormData) => pb.collection('licenses').create(data)

export const updateLicense = (id: string, data: FormData) =>
  pb.collection('licenses').update(id, data)

export const deleteLicense = (id: string) => pb.collection('licenses').delete(id)

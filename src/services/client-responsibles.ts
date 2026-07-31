import pb from '@/lib/pocketbase/client'

export interface ClientResponsible {
  id: string
  client: string
  user: string
  department: string
  role: string
  observations: string
  created: string
  updated: string
  expand?: {
    user?: { id: string; name: string }
    department?: { id: string; name: string }
  }
}

export const getClientResponsibles = (clientId: string) =>
  pb.collection<ClientResponsible>('client_responsibles').getFullList({
    filter: `client = '${clientId}'`,
    expand: 'user,department',
    sort: 'created',
  })

export const createClientResponsible = (
  data: Partial<Omit<ClientResponsible, 'id' | 'created' | 'updated' | 'expand'>>,
) => pb.collection('client_responsibles').create(data)

export const updateClientResponsible = (
  id: string,
  data: Partial<Omit<ClientResponsible, 'id' | 'created' | 'updated' | 'expand'>>,
) => pb.collection('client_responsibles').update(id, data)

export const deleteClientResponsible = (id: string) =>
  pb.collection('client_responsibles').delete(id)

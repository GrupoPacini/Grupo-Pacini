import pb from '@/lib/pocketbase/client'

export interface ClientContact {
  id: string
  client: string
  nome: string
  email: string
  telefone: string
  created: string
  updated: string
}

export const getClientContacts = (clientId: string) =>
  pb.collection<ClientContact>('client_contacts').getFullList({
    filter: `client = '${clientId}'`,
    sort: 'created',
  })

export const createClientContact = (
  data: Partial<Omit<ClientContact, 'id' | 'created' | 'updated'>>,
) => pb.collection('client_contacts').create(data)

export const updateClientContact = (
  id: string,
  data: Partial<Omit<ClientContact, 'id' | 'created' | 'updated'>>,
) => pb.collection('client_contacts').update(id, data)

export const deleteClientContact = (id: string) => pb.collection('client_contacts').delete(id)

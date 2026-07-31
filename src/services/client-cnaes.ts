import pb from '@/lib/pocketbase/client'

export interface ClientCnae {
  id: string
  client: string
  code: string
  description: string
  is_principal: boolean
  created: string
  updated: string
}

export const getClientCnaes = (clientId: string) =>
  pb.collection<ClientCnae>('client_cnaes').getFullList({
    filter: `client = '${clientId}'`,
    sort: '-is_principal,code',
  })

export const createClientCnae = (data: Partial<Omit<ClientCnae, 'id' | 'created' | 'updated'>>) =>
  pb.collection('client_cnaes').create(data)

export const updateClientCnae = (
  id: string,
  data: Partial<Omit<ClientCnae, 'id' | 'created' | 'updated'>>,
) => pb.collection('client_cnaes').update(id, data)

export const deleteClientCnae = (id: string) => pb.collection('client_cnaes').delete(id)

export const ensureSinglePrincipal = async (clientId: string, excludeId?: string) => {
  const all = await getClientCnaes(clientId)
  for (const c of all) {
    if (c.is_principal && c.id !== excludeId) {
      await pb.collection('client_cnaes').update(c.id, { is_principal: false })
    }
  }
}

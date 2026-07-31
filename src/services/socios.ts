import pb from '@/lib/pocketbase/client'

export interface Socio {
  id: string
  client: string
  nome: string
  cpf: string
  participacao_societaria: number | null
  cargo: string
  email: string
  telefone: string
  administrador: boolean
  created: string
  updated: string
}

export const getSocios = (clientId: string) =>
  pb.collection<Socio>('socios').getFullList({
    filter: `client = '${clientId}'`,
    sort: 'nome',
  })

export const createSocio = (data: Partial<Omit<Socio, 'id' | 'created' | 'updated'>>) =>
  pb.collection('socios').create(data)

export const updateSocio = (id: string, data: Partial<Omit<Socio, 'id' | 'created' | 'updated'>>) =>
  pb.collection('socios').update(id, data)

export const deleteSocio = (id: string) => pb.collection('socios').delete(id)

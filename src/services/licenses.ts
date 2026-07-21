import pb from '@/lib/pocketbase/client'

export interface License {
  id: string
  client: string
  name: string
  expiration_date: string
  sem_vencimento: boolean
  status: string
  numero_protocolo: string
  status_operacional: string
  pendencia_atual: string
  observacoes: string
  prioridade: string
  created: string
  updated: string
  expand?: {
    client?: {
      id: string
      name: string
      code: string
      alias: string
      razao_social: string
      cnpj: string
      onboarding_status: string
    }
  }
}

export const getLicenses = () =>
  pb.collection<License>('licenses').getFullList({ expand: 'client', sort: '-created' })

export const getLicense = (id: string) =>
  pb.collection<License>('licenses').getOne(id, { expand: 'client' })

export const createLicense = (data: Record<string, unknown> | FormData) =>
  pb.collection('licenses').create(data)

export const updateLicense = (id: string, data: Record<string, unknown> | FormData) =>
  pb.collection('licenses').update(id, data)

export const deleteLicense = (id: string) => pb.collection('licenses').delete(id)

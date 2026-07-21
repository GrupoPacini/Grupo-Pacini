import pb from '@/lib/pocketbase/client'

export interface License {
  id: string
  client: string
  name: string
  expiration_date: string
  document: string
  status: string
  orgao_emissor: string
  numero_protocolo: string
  data_emissao: string
  status_operacional: string
  pendencia_atual: string
  observacoes: string
  numero_licenca: string
  prioridade: string
  proxima_acao: string
  status_vencimento: string
  responsible: string
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
    responsible?: { id: string; name: string; email: string }
  }
}

export const getLicenses = () =>
  pb.collection<License>('licenses').getFullList({ expand: 'client,responsible', sort: '-created' })

export const getLicense = (id: string) =>
  pb.collection<License>('licenses').getOne(id, { expand: 'client,responsible' })

export const createLicense = (data: Record<string, unknown>) =>
  pb.collection('licenses').create(data)

export const updateLicense = (id: string, data: Record<string, unknown>) =>
  pb.collection('licenses').update(id, data)

export const deleteLicense = (id: string) => pb.collection('licenses').delete(id)

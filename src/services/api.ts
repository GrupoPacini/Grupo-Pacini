import pb from '@/lib/pocketbase/client'

export interface Client {
  id: string
  name: string
  cnpj: string
  tax_regime: string
  code: string
  alias: string
  onboarding_status: string
  created: string
  updated: string
  razao_social: string
  nome_fantasia: string
  municipio: string
  estado: string
  cnae_principal: string
  cnaes_secundarios: string[] | null
  objeto_social: string
  inscricao_estadual: string
  inscricao_municipal: string
  ccm: string
  natureza_juridica: string
  porte: string
  data_abertura: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  telefone: string
  celular: string
  whatsapp: string
  email_principal: string
  site: string
  situacao_cadastral: string
  observacoes_internas: string
  observacoes_atualizado_em: string
  observacoes_atualizado_por: string
  expand?: {
    observacoes_atualizado_por?: { id: string; name: string }
  }
}

export interface Department {
  id: string
  name: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export interface Process {
  id: string
  title: string
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado'
  due_date: string
  notes: string
  client: string
  department: string
  responsible: string
  expand?: {
    client?: Client
    department?: Department
    responsible?: User
  }
}

export const getProcesses = () =>
  pb.collection<Process>('processes').getFullList({
    expand: 'client,department,responsible',
    sort: '-created',
  })

export const getProcess = (id: string) =>
  pb.collection<Process>('processes').getOne(id, { expand: 'client,department,responsible' })

export const updateProcessStatus = (id: string, status: Process['status']) =>
  pb.collection('processes').update(id, { status })

export const updateProcessNotes = (id: string, notes: string) =>
  pb.collection('processes').update(id, { notes })

export const getClients = () => pb.collection<Client>('clients').getFullList({ sort: 'name' })

export const createClient = (data: Partial<Omit<Client, 'id' | 'created'>>) =>
  pb.collection('clients').create(data)

export const updateClient = (id: string, data: Partial<Omit<Client, 'id' | 'created'>>) =>
  pb.collection('clients').update(id, data)

export const deleteClient = (id: string) => pb.collection('clients').delete(id)

export const getClient = (id: string) =>
  pb.collection<Client>('clients').getOne(id, { expand: 'observacoes_atualizado_por' })

export const getProcessesByClient = (clientId: string) =>
  pb.collection<Process>('processes').getFullList({
    filter: `client = '${clientId}'`,
    expand: 'department,responsible',
    sort: '-created',
  })

export const getLicensesByClient = (clientId: string) =>
  pb.collection('licenses').getFullList({
    filter: `client = '${clientId}'`,
    sort: '-created',
  })

export const getDepartments = () =>
  pb.collection<Department>('departments').getFullList({ sort: 'name' })

export const getUsers = () => pb.collection<User>('users').getFullList({ sort: 'name' })

export const createProcess = (data: {
  title: string
  client: string
  department: string
  responsible: string
  due_date: string
  status: Process['status']
  notes?: string
}) => pb.collection('processes').create(data)

export const searchProcesses = async (query: string): Promise<{ items: Process[] }> => {
  return pb.send('/backend/v1/search/processes', {
    method: 'POST',
    body: JSON.stringify({ query, k: 10 }),
    headers: { 'Content-Type': 'application/json' },
  })
}

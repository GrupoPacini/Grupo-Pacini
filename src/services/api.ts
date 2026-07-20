import pb from '@/lib/pocketbase/client'

export interface Client {
  id: string
  name: string
  cnpj: string
  tax_regime: string
  code: string
  alias: string
  created: string
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

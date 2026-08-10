import pb from '@/lib/pocketbase/client'
import type { ClientRecord } from '@/lib/client-utils'

export type { ClientRecord }

export interface ClientListResult {
  items: ClientRecord[]
  totalItems: number
  totalPages: number
  page: number
  perPage: number
}

function escapeFilter(value: string): string {
  return value.replace(/"/g, '')
}

export async function getClientsPaginated(
  page: number = 1,
  perPage: number = 25,
  options: {
    search?: string
    client_status?: string
    tax_regime?: string
    responsavel_interno?: string
  } = {},
): Promise<ClientListResult> {
  const filters: string[] = []

  if (options.search) {
    const q = escapeFilter(options.search)
    filters.push(
      `(razao_social ~ "${q}" || nome_fantasia ~ "${q}" || cnpj ~ "${q}" || code ~ "${q}" || name ~ "${q}")`,
    )
  }
  if (options.client_status && options.client_status !== 'all') {
    filters.push(`client_status = "${options.client_status}"`)
  }
  if (options.tax_regime && options.tax_regime !== 'all') {
    filters.push(`tax_regime = "${options.tax_regime}"`)
  }
  if (options.responsavel_interno && options.responsavel_interno !== 'all') {
    filters.push(`responsavel_interno = "${options.responsavel_interno}"`)
  }

  const filter = filters.length > 0 ? filters.join(' && ') : ''

  const result = await pb.collection('clients').getList(page, perPage, {
    filter,
    sort: '-updated',
    expand: 'responsavel_interno',
  })

  return {
    items: result.items as unknown as ClientRecord[],
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
    perPage: result.perPage,
  }
}

export async function getAllClientsForIndicators(): Promise<ClientRecord[]> {
  return (await pb.collection('clients').getFullList({
    sort: 'name',
    expand: 'responsavel_interno',
    fields:
      'id,name,cnpj,tax_regime,code,codigo_acesso,razao_social,nome_fantasia,client_status,responsavel_interno,situacao_cadastral,created,updated',
  })) as unknown as ClientRecord[]
}

export async function getAllClientsForImport(): Promise<ClientRecord[]> {
  return (await pb.collection('clients').getFullList({
    sort: 'name',
  })) as unknown as ClientRecord[]
}

export async function getClientById(id: string): Promise<ClientRecord> {
  return (await pb.collection('clients').getOne(id, {
    expand: 'responsavel_interno',
  })) as unknown as ClientRecord
}

export async function createClientRecord(data: Record<string, unknown>): Promise<ClientRecord> {
  return (await pb.collection('clients').create(data)) as unknown as ClientRecord
}

export async function updateClientRecord(
  id: string,
  data: Record<string, unknown>,
): Promise<ClientRecord> {
  return (await pb.collection('clients').update(id, data)) as unknown as ClientRecord
}

export async function checkCNPJDuplicate(cnpj: string, excludeId?: string): Promise<boolean> {
  const clean = unmaskCNPJLocal(cnpj)
  if (!clean || clean.length !== 14) return false
  const all = await pb.collection('clients').getFullList({ fields: 'id,cnpj' })
  return all.some((item: any) => {
    if (excludeId && item.id === excludeId) return false
    const itemClean = (item.cnpj || '').replace(/\D/g, '')
    return itemClean === clean
  })
}

export async function checkCodeDuplicate(code: string, excludeId?: string): Promise<boolean> {
  const clean = code.trim().toLowerCase()
  if (!clean) return false
  const all = await pb.collection('clients').getFullList({ fields: 'id,code' })
  return all.some((item: any) => {
    if (excludeId && item.id === excludeId) return false
    return (item.code || '').trim().toLowerCase() === clean
  })
}

export async function generateClientCode(): Promise<string> {
  const all = await pb.collection('clients').getFullList({ fields: 'code' })
  const codes = all
    .map((c: any) => parseInt(c.code || '0', 10))
    .filter((n: number) => !isNaN(n) && n > 0)
  const max = codes.length > 0 ? Math.max(...codes) : 0
  return String(max + 1).padStart(4, '0')
}

function unmaskCNPJLocal(value: string): string {
  return value.replace(/\D/g, '')
}

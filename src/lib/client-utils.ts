export interface ClientRecord {
  id: string
  name: string
  cnpj: string
  tax_regime: string
  code: string
  alias: string
  onboarding_status: string
  razao_social: string
  nome_fantasia: string
  client_status: string
  motivo_inativacao: string
  responsavel_interno: string | null
  nome_contato: string
  email_principal: string
  telefone: string
  whatsapp: string
  situacao_cadastral: string
  data_abertura: string
  created: string
  updated: string
  expand?: {
    responsavel_interno?: { id: string; name: string; email: string }
  }
}

export function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function unmaskCNPJ(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = unmaskCNPJ(cnpj)
  if (clean.length !== 14) return false
  if (/^(\d)\1+$/.test(clean)) return false

  let sum = 0
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (let i = 0; i < 12; i++) sum += parseInt(clean[i]) * w1[i]
  let d1 = sum % 11
  d1 = d1 < 2 ? 0 : 11 - d1
  if (parseInt(clean[12]) !== d1) return false

  sum = 0
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  for (let i = 0; i < 13; i++) sum += parseInt(clean[i]) * w2[i]
  let d2 = sum % 11
  d2 = d2 < 2 ? 0 : 11 - d2
  return parseInt(clean[13]) === d2
}

export function isClientIncomplete(client: ClientRecord): boolean {
  return (
    !client.cnpj?.trim() ||
    !(client.razao_social?.trim() || client.name?.trim()) ||
    !client.tax_regime ||
    !client.situacao_cadastral?.trim() ||
    !client.responsavel_interno
  )
}

export function getDisplayStatus(client: ClientRecord): string {
  if (isClientIncomplete(client)) return 'Cadastro incompleto'
  return client.client_status || 'Ativo'
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Ativo':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400'
    case 'Inativo':
      return 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400'
    case 'Cadastro incompleto':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function regimeBadgeClass(regime: string): string {
  switch (regime) {
    case 'Simples Nacional':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400'
    case 'Lucro Presumido':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400'
    case 'Lucro Real':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

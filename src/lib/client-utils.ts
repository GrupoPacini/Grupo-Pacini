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
  municipio: string
  estado: string
  cnae_principal: string
  cnaes_secundarios: string[] | null
  objeto_social: string
  necessita_validacao_humana: boolean
  motivos_validacao: string[] | null
  objeto_social_classificacao: string
  objeto_social_divergencias: string[] | null
  objeto_social_necessidade_alteracao: boolean
  objeto_social_recomendacao: string
  objeto_social_necessidade_juridica: boolean
  inscricao_estadual: string
  inscricao_municipal: string
  natureza_juridica: string
  porte: string
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
  data_abertura: string
  observacoes_atualizado_em: string
  observacoes_atualizado_por: string
  client_status: string
  motivo_inativacao: string
  responsavel_interno: string
  nome_contato: string
  codigo_acesso: string
  created: string
  updated: string
  expand?: {
    responsavel_interno?: { id: string; name: string }
    observacoes_atualizado_por?: { id: string; name: string }
  }
  [key: string]: unknown
}

export function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function unmaskCNPJ(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return false
  if (/^(\d)\1+$/.test(clean)) return false
  let size = clean.length - 2
  let numbers = clean.substring(0, size)
  const digits = clean.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  size = size + 1
  numbers = clean.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false
  return true
}

export function formatCnpj(cnpj: string): string {
  if (!cnpj) return '—'
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function isClientIncomplete(client: ClientRecord): boolean {
  return !client.cnpj || !client.razao_social || !client.tax_regime
}

export function getDisplayStatus(client: ClientRecord): string {
  if (isClientIncomplete(client)) return 'Cadastro incompleto'
  return client.client_status === 'Inativo' ? 'Inativo' : 'Ativo'
}

export function getClientStatusLabel(client: ClientRecord): string {
  return getDisplayStatus(client)
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Ativo':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400'
    case 'Inativo':
      return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400'
    case 'Cadastro incompleto':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function regimeBadgeClass(regime: string): string {
  switch (regime) {
    case 'Simples Nacional':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'
    case 'Lucro Presumido':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400'
    case 'Lucro Real':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function getClientStatusBadgeClass(client: ClientRecord): string {
  return statusBadgeClass(getDisplayStatus(client))
}

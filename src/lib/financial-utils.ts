export type DataState = 'loading' | 'empty' | 'error' | 'ready'

export interface FinancialSummary {
  receitas: number
  despesas: number
}

export interface CategoryData {
  name: string
  value: number
}

export interface EvolutionDataPoint {
  label: string
  value: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  account: string
  project: string
  type: 'Receita' | 'Despesa'
  value: number
  status: 'Pago' | 'Pendente' | 'Atrasado'
}

export interface FinancialAlert {
  type:
    | 'despesas_elevadas'
    | 'saldo_negativo'
    | 'receitas_em_queda'
    | 'pagamentos_atrasados'
    | 'recebimentos_atrasados'
  message: string
}

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export function formatCompetence(month: number, year: number): string {
  const m = MONTHS.find((mo) => mo.value === String(month))
  return `${m?.label || month}/${year}`
}

export function getImportStatusConfig(status: string): { label: string; badge: string } {
  switch (status) {
    case 'importando':
      return {
        label: 'Importando',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      }
    case 'importacao_concluida':
      return {
        label: 'Concluída',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      }
    case 'erro_importacao':
      return {
        label: 'Erro na importação',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      }
    case 'arquivo_invalido':
      return {
        label: 'Arquivo inválido',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      }
    default:
      return { label: status, badge: 'bg-gray-100 text-gray-800' }
  }
}

export type FinancialReportImport = {
  id: string
  client: string
  month: number
  year: number
  file_name: string
  file_type: string
  status: string
  imported_by: string
  imported_at: string
  notes: string
  record_count: number
  created: string
  updated: string
  expand?: {
    client?: { id: string; name: string; razao_social: string; nome_fantasia: string }
    imported_by?: { id: string; name: string }
  }
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export function getTransactionStatusBadge(status: Transaction['status']): string {
  switch (status) {
    case 'Pago':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'Pendente':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'Atrasado':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

import pb from '@/lib/pocketbase/client'
import type { Transaction } from '@/lib/financial-utils'

export interface FinancialTransaction extends Transaction {
  client: string
  financial_report_import: string
  created: string
  updated: string
}

export interface FinancialFilterOptions {
  client?: string
  dataInicial?: string
  dataFinal?: string
  category?: string
  account?: string
  project?: string
  financialReportImport?: string
  month?: string
  year?: string
}

function buildFilter(opts?: FinancialFilterOptions): string {
  if (!opts) return ''
  const parts: string[] = []
  if (opts.client && opts.client !== 'all') parts.push(`client = "${opts.client}"`)
  if (opts.dataInicial) parts.push(`date >= "${opts.dataInicial}"`)
  if (opts.dataFinal) parts.push(`date <= "${opts.dataFinal}"`)
  if (opts.category && opts.category !== 'Todas') parts.push(`category = "${opts.category}"`)
  if (opts.account && opts.account !== 'Todas') parts.push(`account = "${opts.account}"`)
  if (opts.project && opts.project !== 'Todos') parts.push(`project = "${opts.project}"`)
  if (opts.financialReportImport)
    parts.push(`financial_report_import = "${opts.financialReportImport}"`)
  if (opts.month && opts.year) {
    const m = parseInt(opts.month, 10)
    const y = parseInt(opts.year, 10)
    const lastDay = new Date(y, m, 0).getDate()
    parts.push(`date >= "${y}-${String(m).padStart(2, '0')}-01"`)
    parts.push(`date <= "${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}"`)
  }
  return parts.join(' && ')
}

export async function getFinancialTransactions(
  opts?: FinancialFilterOptions,
): Promise<FinancialTransaction[]> {
  const filter = buildFilter(opts)
  const records = await pb.collection('financial_transactions').getFullList({
    filter: filter || undefined,
    sort: '-date',
  })
  return records.map((r: any) => ({
    id: r.id,
    date: r.date ? r.date.split(' ')[0].split('T')[0] : '',
    description: r.description || '',
    category: r.category || '',
    account: r.account || '',
    project: r.project || '',
    type: r.type,
    value: r.value,
    status: r.status,
    client: r.client,
    financial_report_import: r.financial_report_import || '',
    created: r.created,
    updated: r.updated,
  })) as FinancialTransaction[]
}

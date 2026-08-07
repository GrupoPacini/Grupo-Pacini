import {
  formatBRL,
  type Transaction,
  type EvolutionDataPoint,
  type CategoryData,
  type FinancialAlert,
} from '@/lib/financial-utils'

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]}/${year.slice(2)}`
}

export function groupByMonth(transactions: Transaction[]): EvolutionDataPoint[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    const month = t.date.substring(0, 7)
    map.set(month, (map.get(month) || 0) + t.value)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ label: formatMonthLabel(month), value }))
}

export function groupByCategory(transactions: Transaction[]): CategoryData[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    const cat = t.category || 'Sem categoria'
    map.set(cat, (map.get(cat) || 0) + t.value)
  }
  return Array.from(map.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))
}

export function computeSaldoEvolution(transactions: Transaction[]): EvolutionDataPoint[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  const map = new Map<string, number>()
  let cumulative = 0
  for (const t of sorted) {
    const month = t.date.substring(0, 7)
    cumulative += t.type === 'Receita' ? t.value : -t.value
    map.set(month, cumulative)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ label: formatMonthLabel(month), value }))
}

export function computeAlerts(
  transactions: Transaction[],
  receitasTotal: number,
  despesasTotal: number,
): FinancialAlert[] {
  const alerts: FinancialAlert[] = []
  if (receitasTotal > 0 && despesasTotal > receitasTotal) {
    alerts.push({
      type: 'despesas_elevadas',
      message: 'As despesas superam as receitas no período selecionado.',
    })
  }
  if (receitasTotal - despesasTotal < 0) {
    alerts.push({ type: 'saldo_negativo', message: 'O resultado do período está negativo.' })
  }
  const receitasByMonth = groupByMonth(transactions.filter((t) => t.type === 'Receita'))
  if (receitasByMonth.length >= 2) {
    const last = receitasByMonth[receitasByMonth.length - 1]
    const prev = receitasByMonth[receitasByMonth.length - 2]
    if (last.value < prev.value) {
      alerts.push({
        type: 'receitas_em_queda',
        message: `Receitas caíram de ${formatBRL(prev.value)} para ${formatBRL(last.value)} no último mês.`,
      })
    }
  }
  const pagamentosAtrasados = transactions.filter(
    (t) => t.type === 'Despesa' && t.status === 'Atrasado',
  )
  if (pagamentosAtrasados.length > 0) {
    alerts.push({
      type: 'pagamentos_atrasados',
      message: `${pagamentosAtrasados.length} pagamento(s) em atraso.`,
    })
  }
  const recebimentosAtrasados = transactions.filter(
    (t) => t.type === 'Receita' && t.status === 'Atrasado',
  )
  if (recebimentosAtrasados.length > 0) {
    alerts.push({
      type: 'recebimentos_atrasados',
      message: `${recebimentosAtrasados.length} recebimento(s) em atraso.`,
    })
  }
  return alerts
}

export function generateAnalysis(
  receitasTotal: number,
  despesasTotal: number,
  resultado: number,
  transactionCount: number,
): string {
  const lines: string[] = []
  lines.push('Análise do período selecionado:')
  lines.push('')
  lines.push(`Total de lançamentos: ${transactionCount}`)
  lines.push(`Total de Receitas: ${formatBRL(receitasTotal)}`)
  lines.push(`Total de Despesas: ${formatBRL(despesasTotal)}`)
  lines.push(`Resultado: ${formatBRL(resultado)}`)
  lines.push('')
  if (resultado > 0) {
    lines.push('O período apresenta resultado positivo, com receitas superando as despesas.')
  } else if (resultado < 0) {
    lines.push(
      'Atenção: o período apresenta resultado negativo, com despesas superando as receitas.',
    )
  } else {
    lines.push('O período apresenta resultado equilibrado.')
  }
  if (receitasTotal > 0) {
    const margem = ((resultado / receitasTotal) * 100).toFixed(1)
    lines.push(`Margem líquida: ${margem}%.`)
  }
  return lines.join('\n')
}

export function computeSaldoFinal(
  _transactions: Transaction[],
  _receitasTotal: number,
  _despesasTotal: number,
): number | null {
  // Priority 1: Saldo inicial (opening balance) — not available
  // The current database schema (financial_transactions, financial_report_imports)
  // does not include a saldo_inicial or opening_balance field.

  // Priority 2: Balance column from imported file — not available
  // The current schema does not have a balance field on financial_transactions
  // or financial_report_imports.

  // Priority 3: Cannot be determined reliably
  return null
}

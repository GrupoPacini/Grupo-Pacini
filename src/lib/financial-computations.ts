import {
  formatBRL,
  type Transaction,
  type EvolutionDataPoint,
  type CategoryData,
  type FinancialAlert,
} from '@/lib/financial-utils'

export function computeResultado(transactions: Transaction[]): {
  receitas: number
  despesas: number
  resultado: number
} {
  const receitas = transactions.filter((t) => t.type === 'Receita').reduce((s, t) => s + t.value, 0)
  const despesas = transactions.filter((t) => t.type === 'Despesa').reduce((s, t) => s + t.value, 0)
  return { receitas, despesas, resultado: receitas - despesas }
}

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

export interface SaldoFinalComputation {
  saldoFinal: number | null
  openingBalance: number | null
  resultado: number | null
  lastCompetence: { month: number; year: number } | null
  unavailable: boolean
  divergence: {
    previousSaldoFinal: number
    currentOpeningBalance: number
    difference: number
  } | null
}

interface ImportLike {
  id?: string
  month: number
  year: number
  opening_balance?: number | null
}

function getPreviousCompetence(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

function filterTxByCompetence(
  transactions: Transaction[],
  month: number,
  year: number,
): Transaction[] {
  return transactions.filter((t) => {
    const parts = t.date.substring(0, 7).split('-')
    return Number(parts[0]) === year && Number(parts[1]) === month
  })
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeSaldoFinalV2(
  allClientTransactions: Transaction[],
  imports: ImportLike[],
  filters: { mes: string[]; ano: string },
): SaldoFinalComputation {
  const empty: SaldoFinalComputation = {
    saldoFinal: null,
    openingBalance: null,
    resultado: null,
    lastCompetence: null,
    unavailable: true,
    divergence: null,
  }

  const allCompetences = new Map<string, { month: number; year: number }>()
  for (const imp of imports) {
    allCompetences.set(`${imp.year}-${imp.month}`, { month: imp.month, year: imp.year })
  }
  for (const t of allClientTransactions) {
    const parts = t.date.substring(0, 7).split('-')
    const y = Number(parts[0])
    const m = Number(parts[1])
    allCompetences.set(`${y}-${m}`, { month: m, year: y })
  }

  if (allCompetences.size === 0) return empty

  const sortedCompetences = Array.from(allCompetences.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  )

  const isAllMonths = filters.mes.includes('all') || filters.mes.length === 0
  const isAllYears = filters.ano === 'all'
  const selectedMonths = filters.mes.filter((m) => m !== 'all').map(Number)
  const selectedYear = isAllYears ? null : Number(filters.ano)

  let cutoff: { month: number; year: number } | null = null
  for (const comp of sortedCompetences) {
    if (selectedYear !== null && comp.year !== selectedYear) continue
    if (!isAllMonths && !selectedMonths.includes(comp.month)) continue
    if (
      !cutoff ||
      comp.year > cutoff.year ||
      (comp.year === cutoff.year && comp.month > cutoff.month)
    ) {
      cutoff = comp
    }
  }

  if (!cutoff) return empty

  const chain = sortedCompetences.filter(
    (c) => c.year < cutoff!.year || (c.year === cutoff!.year && c.month <= cutoff!.month),
  )

  if (chain.length === 0) return empty

  let firstIdx = -1
  let firstOpeningBalance = 0
  for (let i = 0; i < chain.length; i++) {
    const imp = imports.find((im) => im.month === chain[i].month && im.year === chain[i].year)
    if (imp && imp.opening_balance != null) {
      firstIdx = i
      firstOpeningBalance = imp.opening_balance
      break
    }
  }

  if (firstIdx === -1) return empty

  let accumulated = firstOpeningBalance
  const accumulatedByIndex: number[] = []
  for (let i = firstIdx; i < chain.length; i++) {
    const tx = filterTxByCompetence(allClientTransactions, chain[i].month, chain[i].year)
    const { resultado } = computeResultado(tx)
    accumulated += resultado
    accumulatedByIndex[i] = roundCurrency(accumulated)
  }

  const lastIdx = chain.length - 1
  const saldoFinal = accumulatedByIndex[lastIdx]
  const totalResultado = saldoFinal - firstOpeningBalance

  let divergence: SaldoFinalComputation['divergence'] = null
  if (lastIdx > firstIdx) {
    const lastComp = chain[lastIdx]
    const lastImport = imports.find(
      (im) => im.month === lastComp.month && im.year === lastComp.year,
    )
    if (lastImport && lastImport.opening_balance != null) {
      const prevAccumulated = accumulatedByIndex[lastIdx - 1] ?? firstOpeningBalance
      const diff = roundCurrency(lastImport.opening_balance - prevAccumulated)
      if (diff !== 0) {
        divergence = {
          previousSaldoFinal: roundCurrency(prevAccumulated),
          currentOpeningBalance: roundCurrency(lastImport.opening_balance),
          difference: diff,
        }
      }
    }
  }

  return {
    saldoFinal,
    openingBalance: firstOpeningBalance,
    resultado: roundCurrency(totalResultado),
    lastCompetence: cutoff,
    unavailable: false,
    divergence,
  }
}

export interface ContinuityStatus {
  state: 'conciliado' | 'divergencia' | 'sem_referencia'
  previousCompetence: { month: number; year: number } | null
  previousSaldoFinal: number | null
  currentSaldoInicial: number | null
  difference: number | null
}

export function computeContinuityMap(
  allClientTransactions: Transaction[],
  imports: ImportLike[],
): Map<string, ContinuityStatus> {
  const result = new Map<string, ContinuityStatus>()

  for (const imp of imports) {
    const key = imp.id || `${imp.year}-${imp.month}`

    if (imp.opening_balance == null) {
      result.set(key, {
        state: 'sem_referencia',
        previousCompetence: null,
        previousSaldoFinal: null,
        currentSaldoInicial: null,
        difference: null,
      })
      continue
    }

    const prevComp = getPreviousCompetence(imp.month, imp.year)
    const prevImport = imports.find((p) => p.month === prevComp.month && p.year === prevComp.year)

    if (!prevImport || prevImport.opening_balance == null) {
      result.set(key, {
        state: 'sem_referencia',
        previousCompetence: prevComp,
        previousSaldoFinal: null,
        currentSaldoInicial: imp.opening_balance,
        difference: null,
      })
      continue
    }

    const currentSaldoInicial = imp.opening_balance
    const prevTx = filterTxByCompetence(allClientTransactions, prevComp.month, prevComp.year)
    const { resultado: prevResultado } = computeResultado(prevTx)
    const prevSaldoFinal = prevImport.opening_balance + prevResultado

    const diff = roundCurrency(currentSaldoInicial - prevSaldoFinal)

    result.set(key, {
      state: diff === 0 ? 'conciliado' : 'divergencia',
      previousCompetence: prevComp,
      previousSaldoFinal: roundCurrency(prevSaldoFinal),
      currentSaldoInicial: roundCurrency(currentSaldoInicial),
      difference: diff,
    })
  }

  return result
}

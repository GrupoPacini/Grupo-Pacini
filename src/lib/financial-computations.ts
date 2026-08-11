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

function competenceLabel(mes: number, ano: number): string {
  return formatMonthLabel(`${ano}-${String(mes).padStart(2, '0')}`)
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

interface ImportLike {
  id?: string
  month: number
  year: number
  opening_balance?: number | null
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
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

function findImport(imports: ImportLike[], month: number, year: number): ImportLike | undefined {
  return imports.find((im) => im.month === month && im.year === year)
}

export interface SaldoHistoryEntry {
  mes: number
  ano: number
  saldoInicial: number | null
  receitas: number
  despesas: number
  resultado: number
  saldoFinal: number | null
  divergencia: boolean
  divergenciaDetail: {
    openingBalance: number
    expectedSaldoFinal: number
    difference: number
  } | null
}

export function computeSaldoHistory(
  allClientTransactions: Transaction[],
  imports: ImportLike[],
): SaldoHistoryEntry[] {
  const competences = new Map<string, { month: number; year: number }>()
  for (const imp of imports) {
    competences.set(`${imp.year}-${imp.month}`, { month: imp.month, year: imp.year })
  }
  for (const t of allClientTransactions) {
    const parts = t.date.substring(0, 7).split('-')
    const y = Number(parts[0])
    const m = Number(parts[1])
    competences.set(`${y}-${m}`, { month: m, year: y })
  }

  const sorted = Array.from(competences.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  )
  if (sorted.length === 0) return []

  let firstValidIdx = -1
  for (let i = 0; i < sorted.length; i++) {
    const imp = findImport(imports, sorted[i].month, sorted[i].year)
    if (imp && imp.opening_balance != null) {
      firstValidIdx = i
      break
    }
  }

  const result: SaldoHistoryEntry[] = []
  let accumulated: number | null = null

  for (let i = 0; i < sorted.length; i++) {
    const comp = sorted[i]
    const imp = findImport(imports, comp.month, comp.year)
    const tx = filterTxByCompetence(allClientTransactions, comp.month, comp.year)
    const { receitas, despesas, resultado } = computeResultado(tx)

    if (firstValidIdx === -1 || i < firstValidIdx) {
      result.push({
        mes: comp.month,
        ano: comp.year,
        saldoInicial: imp?.opening_balance ?? null,
        receitas,
        despesas,
        resultado,
        saldoFinal: null,
        divergencia: false,
        divergenciaDetail: null,
      })
      continue
    }

    if (i === firstValidIdx) {
      const saldoInicial = imp!.opening_balance!
      accumulated = roundCurrency(saldoInicial + resultado)
      result.push({
        mes: comp.month,
        ano: comp.year,
        saldoInicial: roundCurrency(saldoInicial),
        receitas,
        despesas,
        resultado,
        saldoFinal: accumulated,
        divergencia: false,
        divergenciaDetail: null,
      })
    } else {
      const openingBalance = imp?.opening_balance ?? null
      const prevSaldoFinal = accumulated!
      accumulated = roundCurrency(prevSaldoFinal + resultado)

      let divergencia = false
      let divergenciaDetail: SaldoHistoryEntry['divergenciaDetail'] = null
      if (openingBalance != null) {
        const diff = roundCurrency(openingBalance - prevSaldoFinal)
        if (diff !== 0) {
          divergencia = true
          divergenciaDetail = {
            openingBalance: roundCurrency(openingBalance),
            expectedSaldoFinal: roundCurrency(prevSaldoFinal),
            difference: diff,
          }
        }
      }

      result.push({
        mes: comp.month,
        ano: comp.year,
        saldoInicial: openingBalance != null ? roundCurrency(openingBalance) : null,
        receitas,
        despesas,
        resultado,
        saldoFinal: accumulated,
        divergencia,
        divergenciaDetail,
      })
    }
  }

  return result
}

export function buildSaldoFinalChartData(history: SaldoHistoryEntry[]): EvolutionDataPoint[] {
  const valid = history.filter((e) => e.saldoFinal !== null)
  if (valid.length === 0) return []
  const points: EvolutionDataPoint[] = []
  const first = valid[0]
  if (first.saldoInicial !== null) {
    points.push({ label: competenceLabel(first.mes, first.ano), value: first.saldoInicial })
  }
  for (const e of valid) {
    points.push({ label: competenceLabel(e.mes, e.ano), value: e.saldoFinal! })
  }
  return points
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

  const history = computeSaldoHistory(allClientTransactions, imports)
  if (history.length === 0) return empty

  const isAllMonths = filters.mes.includes('all') || filters.mes.length === 0
  const isAllYears = filters.ano === 'all'
  const selectedMonths = filters.mes.filter((m) => m !== 'all').map(Number)
  const selectedYear = isAllYears ? null : Number(filters.ano)

  let cutoffIdx = -1
  for (let i = 0; i < history.length; i++) {
    const e = history[i]
    if (selectedYear !== null && e.ano !== selectedYear) continue
    if (!isAllMonths && !selectedMonths.includes(e.mes)) continue
    cutoffIdx = i
  }

  if (cutoffIdx === -1) return empty

  const cutoff = history[cutoffIdx]
  if (cutoff.saldoFinal === null) {
    return { ...empty, lastCompetence: { month: cutoff.mes, year: cutoff.ano } }
  }

  let firstOpeningBalance: number | null = null
  let totalResultado = 0
  for (let i = 0; i <= cutoffIdx; i++) {
    const e = history[i]
    if (e.saldoFinal === null) continue
    if (firstOpeningBalance === null) firstOpeningBalance = e.saldoInicial
    totalResultado = roundCurrency(totalResultado + e.resultado)
  }

  let divergence: SaldoFinalComputation['divergence'] = null
  if (cutoff.divergencia && cutoff.divergenciaDetail) {
    divergence = {
      previousSaldoFinal: cutoff.divergenciaDetail.expectedSaldoFinal,
      currentOpeningBalance: cutoff.divergenciaDetail.openingBalance,
      difference: cutoff.divergenciaDetail.difference,
    }
  }

  return {
    saldoFinal: cutoff.saldoFinal,
    openingBalance: firstOpeningBalance,
    resultado: totalResultado,
    lastCompetence: { month: cutoff.mes, year: cutoff.ano },
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
  const history = computeSaldoHistory(allClientTransactions, imports)
  const result = new Map<string, ContinuityStatus>()

  for (let i = 0; i < history.length; i++) {
    const entry = history[i]
    const imp = findImport(imports, entry.mes, entry.ano)
    const key = imp?.id || `${entry.ano}-${entry.mes}`

    if (entry.saldoInicial === null) {
      result.set(key, {
        state: 'sem_referencia',
        previousCompetence: null,
        previousSaldoFinal: null,
        currentSaldoInicial: null,
        difference: null,
      })
      continue
    }

    if (i === 0 || history[i - 1].saldoFinal === null) {
      const prevComp = i > 0 ? { month: history[i - 1].mes, year: history[i - 1].ano } : null
      result.set(key, {
        state: 'sem_referencia',
        previousCompetence: prevComp,
        previousSaldoFinal: null,
        currentSaldoInicial: entry.saldoInicial,
        difference: null,
      })
      continue
    }

    const prev = history[i - 1]
    const prevSaldoFinal = prev.saldoFinal!

    if (entry.divergencia && entry.divergenciaDetail) {
      result.set(key, {
        state: 'divergencia',
        previousCompetence: { month: prev.mes, year: prev.ano },
        previousSaldoFinal: roundCurrency(prevSaldoFinal),
        currentSaldoInicial: entry.saldoInicial,
        difference: entry.divergenciaDetail.difference,
      })
    } else {
      result.set(key, {
        state: 'conciliado',
        previousCompetence: { month: prev.mes, year: prev.ano },
        previousSaldoFinal: roundCurrency(prevSaldoFinal),
        currentSaldoInicial: entry.saldoInicial,
        difference: 0,
      })
    }
  }

  return result
}

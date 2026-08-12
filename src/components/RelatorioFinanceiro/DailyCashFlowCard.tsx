import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { ChartStateDisplay } from './ChartStateDisplay'
import { CalendarDays } from 'lucide-react'
import {
  formatBRL,
  formatDateBR,
  getDayOfMonth,
  MONTHS,
  type DataState,
  type Transaction,
} from '@/lib/financial-utils'

interface DailyCashFlowPoint {
  day: string
  fullDate: string
  entradas: number
  saidas: number
}

interface DailyCashFlowCardProps {
  transactions: Transaction[]
  state: DataState
}

interface Competence {
  value: string
  label: string
}

function extractCompetences(transactions: Transaction[]): Competence[] {
  const map = new Map<string, string>()
  for (const t of transactions) {
    const ym = t.date.split('T')[0].split(' ')[0].substring(0, 7)
    if (!map.has(ym)) {
      const [y, m] = ym.split('-')
      const label = `${MONTHS.find((mo) => mo.value === String(Number(m)))?.label || m}/${y}`
      map.set(ym, label)
    }
  }
  return Array.from(map, ([value, label]) => ({ value, label })).sort((a, b) =>
    a.value.localeCompare(b.value),
  )
}

function aggregateDaily(transactions: Transaction[]): DailyCashFlowPoint[] {
  const map = new Map<string, { entradas: number; saidas: number }>()
  for (const t of transactions) {
    const datePart = t.date.split('T')[0].split(' ')[0]
    if (!datePart) continue
    if (!map.has(datePart)) map.set(datePart, { entradas: 0, saidas: 0 })
    const entry = map.get(datePart)!
    if (t.type === 'Receita') entry.entradas += t.value
    else entry.saidas += t.value
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([datePart, val]) => ({
      day: getDayOfMonth(datePart),
      fullDate: formatDateBR(datePart),
      entradas: val.entradas,
      saidas: val.saidas,
    }))
}

function abbreviateBRL(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`
  return `R$ ${value.toFixed(0)}`
}

interface TooltipPayloadItem {
  dataKey: string
  value: number
  payload: DailyCashFlowPoint
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1">
      {payload.map((item) => {
        const label = item.dataKey === 'entradas' ? 'Entradas' : 'Saídas'
        const color = item.dataKey === 'entradas' ? 'text-green-600' : 'text-red-600'
        return (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span className="text-muted-foreground">{point.fullDate} —</span>
            <span className={color}>{label}:</span>
            <span className="font-medium">{formatBRL(item.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

const chartConfig = {
  entradas: { label: 'Entradas', color: 'hsl(142 71% 45%)' },
  saidas: { label: 'Saídas', color: 'hsl(0 72% 51%)' },
}

export function DailyCashFlowCard({ transactions, state }: DailyCashFlowCardProps) {
  const [selectedCompetence, setSelectedCompetence] = useState('')

  const competences = useMemo(() => extractCompetences(transactions), [transactions])

  const effectiveCompetence = useMemo(() => {
    if (competences.length === 0) return ''
    if (selectedCompetence && competences.some((c) => c.value === selectedCompetence)) {
      return selectedCompetence
    }
    return competences[competences.length - 1].value
  }, [competences, selectedCompetence])

  const scopedTransactions = useMemo(() => {
    if (!effectiveCompetence) return []
    return transactions.filter((t) => {
      const ym = t.date.split('T')[0].split(' ')[0].substring(0, 7)
      return ym === effectiveCompetence
    })
  }, [transactions, effectiveCompetence])

  const data = useMemo(() => aggregateDaily(scopedTransactions), [scopedTransactions])
  const hasData = state === 'ready' && data.length > 0

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary shrink-0" />
            <div>
              <CardTitle className="text-base font-semibold">Fluxo de Caixa Diário</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Entradas e saídas dia a dia
              </CardDescription>
            </div>
          </div>
          {competences.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                Competência
              </span>
              <Select value={effectiveCompetence} onValueChange={setSelectedCompetence}>
                <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {competences.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <div className="h-[300px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={abbreviateBRL}
                    width={70}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fillOpacity: 0.05 }} />
                  <Bar
                    dataKey="entradas"
                    fill={chartConfig.entradas.color}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="saidas"
                    fill={chartConfig.saidas.color}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: chartConfig.entradas.color }}
                />
                <span className="text-muted-foreground">Entradas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: chartConfig.saidas.color }}
                />
                <span className="text-muted-foreground">Saídas</span>
              </div>
            </div>
          </>
        ) : (
          <ChartStateDisplay
            state={state}
            emptyMessage="Nenhuma movimentação encontrada para o período selecionado."
            className="h-48"
          />
        )}
      </CardContent>
    </Card>
  )
}

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { ChartStateDisplay } from './ChartStateDisplay'
import { CalendarDays } from 'lucide-react'
import {
  formatBRL,
  formatDateBR,
  getDayOfMonth,
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
  const data = useMemo(() => aggregateDaily(transactions), [transactions])
  const hasData = state === 'ready' && data.length > 0

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          <div>
            <CardTitle className="text-base font-semibold">Fluxo de Caixa Diário</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Entradas e saídas dia a dia
            </CardDescription>
          </div>
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

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { ChartStateDisplay } from './ChartStateDisplay'
import { Button } from '@/components/ui/button'
import {
  CHART_COLORS,
  formatBRL,
  formatPercent,
  type CategoryData,
  type DataState,
} from '@/lib/financial-utils'
import { PieChart as PieChartIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const LEGEND_MAX = 10
const CHART_MAX_SLICES = 8

interface CategoryDonutCardProps {
  title: string
  data: CategoryData[] | null
  state: DataState
}

function DonutTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number }>
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const name = item.name ?? ''
  const value = item.value ?? 0
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md text-xs space-y-0.5">
      <p className="font-medium text-foreground">{name}</p>
      <p className="text-muted-foreground">{formatBRL(value)}</p>
      <p className="text-muted-foreground">{pct.toFixed(1)}%</p>
    </div>
  )
}

export function CategoryDonutCard({ title, data, state }: CategoryDonutCardProps) {
  const [expanded, setExpanded] = useState(false)

  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0
  const chartConfig = { value: { label: title } }
  const hasData = state === 'ready' && data && data.length > 0

  const sortedData = data ? [...data].sort((a, b) => b.value - a.value) : []

  const chartTop = sortedData.slice(0, CHART_MAX_SLICES)
  const chartRest = sortedData.slice(CHART_MAX_SLICES)
  const chartData =
    chartRest.length > 0
      ? [...chartTop, { name: 'Outros', value: chartRest.reduce((s, d) => s + d.value, 0) }]
      : chartTop

  const hasMore = sortedData.length > LEGEND_MAX
  const legendData = expanded ? sortedData : sortedData.slice(0, LEGEND_MAX)

  const getColor = (index: number) =>
    CHART_COLORS[(index < CHART_MAX_SLICES ? index : CHART_MAX_SLICES) % CHART_COLORS.length]

  return (
    <Card className="border-t-4 border-t-accent shadow-sm flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <PieChartIcon size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {hasData ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
            <ChartContainer config={chartConfig} className="h-[180px] w-[180px] shrink-0">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {chartData.map((d, i) => (
                    <Cell key={d.name + i} fill={getColor(i)} />
                  ))}
                </Pie>
                <ChartTooltip content={<DonutTooltip total={total} />} />
              </PieChart>
            </ChartContainer>
            <div className="flex-1 w-full min-w-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_3rem] gap-x-3 text-xs font-medium text-muted-foreground pb-1.5 border-b mb-1">
                <span>Categoria</span>
                <span className="text-right">Valor</span>
                <span className="text-right">%</span>
              </div>
              <div className={cn('space-y-1', expanded && 'max-h-[260px] overflow-y-auto pr-1')}>
                {legendData.map((d, i) => (
                  <div
                    key={d.name}
                    className="grid grid-cols-[minmax(0,1fr)_auto_3rem] gap-x-3 items-center text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: getColor(i) }}
                      />
                      <span className="truncate" title={d.name}>
                        {d.name}
                      </span>
                    </div>
                    <span className="font-medium text-right tabular-nums whitespace-nowrap">
                      {formatBRL(d.value)}
                    </span>
                    <span className="text-xs text-muted-foreground text-right tabular-nums">
                      {formatPercent(d.value, total)}
                    </span>
                  </div>
                ))}
              </div>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs h-8"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? (
                    <>
                      <ChevronUp size={14} />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Ver todas as categorias ({sortedData.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ChartStateDisplay state={state} emptyMessage="Nenhum dado disponível" className="h-40" />
        )}
      </CardContent>
    </Card>
  )
}

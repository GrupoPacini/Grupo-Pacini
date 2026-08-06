import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ChartStateDisplay } from './ChartStateDisplay'
import {
  CHART_COLORS,
  formatBRL,
  formatPercent,
  type CategoryData,
  type DataState,
} from '@/lib/financial-utils'
import { PieChart as PieChartIcon } from 'lucide-react'

interface CategoryDonutCardProps {
  title: string
  data: CategoryData[] | null
  state: DataState
}

export function CategoryDonutCard({ title, data, state }: CategoryDonutCardProps) {
  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0
  const chartConfig = { value: { label: title } }
  const hasData = state === 'ready' && data && data.length > 0

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <PieChartIcon size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ChartContainer config={chartConfig} className="h-[180px] w-[180px] shrink-0">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex-1 space-y-2 w-full">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatBRL(d.value)}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {formatPercent(d.value, total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ChartStateDisplay state={state} emptyMessage="Nenhum dado disponível" className="h-40" />
        )}
      </CardContent>
    </Card>
  )
}

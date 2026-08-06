import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, LineChart, Bar, BarChart, Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ChartStateDisplay } from './ChartStateDisplay'
import { type DataState, type EvolutionDataPoint } from '@/lib/financial-utils'
import type { LucideIcon } from 'lucide-react'

type ChartVariant = 'line' | 'bar' | 'area'

interface EvolutionChartCardProps {
  title: string
  icon: LucideIcon
  variant: ChartVariant
  data: EvolutionDataPoint[] | null
  state: DataState
  chartColor?: string
  gradientId?: string
}

export function EvolutionChartCard({
  title,
  icon: Icon,
  variant,
  data,
  state,
  chartColor = 'hsl(var(--chart-1))',
  gradientId,
}: EvolutionChartCardProps) {
  const chartConfig = { value: { label: title } }
  const hasData = state === 'ready' && data && data.length > 0
  const gid = gradientId || `grad-${title.replace(/\s+/g, '-').toLowerCase()}`

  const chart =
    variant === 'bar' ? (
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    ) : variant === 'area' ? (
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={chartColor}
          fill={`url(#${gid})`}
          strokeWidth={2}
        />
      </AreaChart>
    ) : (
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    )

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {hasData ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              {chart}
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20">
              <ChartStateDisplay
                state={state}
                emptyMessage="Nenhum dado disponível"
                className="h-full"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

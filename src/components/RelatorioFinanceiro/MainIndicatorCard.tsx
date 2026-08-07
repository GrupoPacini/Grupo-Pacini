import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { ChartStateDisplay } from './ChartStateDisplay'
import { formatBRL, type DataState, type EvolutionDataPoint } from '@/lib/financial-utils'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainIndicatorCardProps {
  title: string
  icon: LucideIcon
  iconColor: string
  bg: string
  data: EvolutionDataPoint[] | null
  state: DataState
  total: number | null
  chartColor: string
  gradientId: string
  resultColor?: string
  unavailable?: boolean
}

export function MainIndicatorCard({
  title,
  icon: Icon,
  iconColor,
  bg,
  data,
  state,
  total,
  chartColor,
  gradientId,
  resultColor,
  unavailable,
}: MainIndicatorCardProps) {
  const chartConfig = { value: { label: title } }
  const hasData = state === 'ready' && !unavailable && data && data.length > 0

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          <div className={cn('rounded-full p-2', bg)}>
            <Icon size={18} className={iconColor} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
            {state === 'ready' && unavailable ? (
              <p className="text-base font-medium text-muted-foreground">Saldo não disponível</p>
            ) : (
              <p
                className={cn(
                  'text-2xl font-bold',
                  state === 'ready' && total != null
                    ? resultColor || 'text-foreground'
                    : 'text-muted-foreground/40',
                )}
              >
                {state === 'ready' && total != null ? formatBRL(total) : formatBRL(0)}
              </p>
            )}
          </div>
          <div className="h-32 flex items-center justify-center rounded-lg bg-muted/30 border border-dashed border-muted-foreground/20">
            {hasData ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartStateDisplay
                state={state}
                emptyMessage="Sem dados para exibir"
                className="h-full"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

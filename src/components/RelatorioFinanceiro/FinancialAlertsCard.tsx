import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bell,
  Loader2,
  AlertCircle,
  TrendingDown,
  AlertTriangle,
  ArrowDownCircle,
  Clock,
  FileWarning,
} from 'lucide-react'
import { type DataState, type FinancialAlert } from '@/lib/financial-utils'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AlertConfig {
  icon: LucideIcon
  color: string
  bg: string
  label: string
}

const ALERT_CONFIG: Record<FinancialAlert['type'], AlertConfig> = {
  despesas_elevadas: {
    icon: TrendingDown,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    label: 'Despesas Elevadas',
  },
  saldo_negativo: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/20',
    label: 'Saldo Negativo',
  },
  receitas_em_queda: {
    icon: ArrowDownCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/20',
    label: 'Receitas em Queda',
  },
  pagamentos_atrasados: {
    icon: Clock,
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/20',
    label: 'Pagamentos Atrasados',
  },
  recebimentos_atrasados: {
    icon: FileWarning,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Recebimentos Atrasados',
  },
}

interface FinancialAlertsCardProps {
  state: DataState
  alerts: FinancialAlert[] | null
}

export function FinancialAlertsCard({ state, alerts }: FinancialAlertsCardProps) {
  const hasAlerts = state === 'ready' && alerts && alerts.length > 0

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">Alertas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {state === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-2 text-primary/60" />
            <p className="text-sm">Verificando alertas...</p>
          </div>
        ) : state === 'error' ? (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertCircle size={24} className="mb-2 text-destructive/60" />
            <p className="text-sm">Erro ao carregar alertas</p>
          </div>
        ) : hasAlerts ? (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const cfg = ALERT_CONFIG[alert.type]
              const Icon = cfg.icon
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div className={cn('rounded-full p-2 shrink-0', cfg.bg)}>
                    <Icon size={16} className={cfg.color} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell size={24} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

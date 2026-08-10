import { useMemo } from 'react'
import type { Process } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { isProcessActive, isProcessDelayed } from '@/lib/process-utils'

export function ProcessIndicators({ processes }: { processes: Process[] }) {
  const stats = useMemo(
    () => ({
      active: processes.filter((p) => isProcessActive(p.status)).length,
      delayed: processes.filter((p) => isProcessDelayed(p.status, p.due_date)).length,
      concluded: processes.filter((p) => p.status === 'Concluído').length,
    }),
    [processes],
  )

  const cards = [
    { label: 'Processos ativos', value: stats.active, icon: Activity, color: 'text-blue-600' },
    {
      label: 'Processos atrasados',
      value: stats.delayed,
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      label: 'Processos concluídos',
      value: stats.concluded,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground font-medium">{card.label}</span>
              <Icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </Card>
        )
      })}
    </div>
  )
}

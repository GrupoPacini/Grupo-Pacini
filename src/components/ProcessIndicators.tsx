import { Card } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Process } from '@/services/api'
import { isActiveStatus, isOverdue } from '@/lib/process-utils'
import { cn } from '@/lib/utils'

export function ProcessIndicators({ processes }: { processes: Process[] }) {
  const active = processes.filter((p) => isActiveStatus(p.status)).length
  const overdue = processes.filter((p) => isActiveStatus(p.status) && isOverdue(p.due_date)).length
  const completed = processes.filter((p) => p.status === 'Concluído').length

  const cards = [
    {
      label: 'Processos Ativos',
      value: active,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      border: 'border-l-blue-500',
    },
    {
      label: 'Processos Atrasados',
      value: overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-500/10',
      border: 'border-l-red-500',
    },
    {
      label: 'Processos Concluídos',
      value: completed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
      border: 'border-l-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.label}
            className={cn('p-4 shadow-sm border-l-4 transition-all hover:shadow-md', card.border)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
              </div>
              <div className={cn('rounded-full p-3', card.bg)}>
                <Icon size={20} className={card.color} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

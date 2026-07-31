import { Users, UserCheck, UserX, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorCounts {
  total: number
  ativos: number
  inativos: number
  incompletos: number
}

interface Props {
  counts: IndicatorCounts
  onFilter: (status: string) => void
  activeFilter: string
}

export function ClientIndicators({ counts, onFilter, activeFilter }: Props) {
  const cards = [
    {
      label: 'Total de Clientes',
      value: counts.total,
      icon: Users,
      description: 'Todos os cadastros',
      color: 'text-primary',
      bg: 'bg-primary/5',
      filterValue: 'all',
    },
    {
      label: 'Clientes Ativos',
      value: counts.ativos,
      icon: UserCheck,
      description: 'Empresas em atendimento',
      color: 'text-green-600',
      bg: 'bg-green-500/5',
      filterValue: 'Ativo',
    },
    {
      label: 'Clientes Inativos',
      value: counts.inativos,
      icon: UserX,
      description: 'Cadastros encerrados',
      color: 'text-gray-500',
      bg: 'bg-gray-500/5',
      filterValue: 'Inativo',
    },
    {
      label: 'Cadastros Incompletos',
      value: counts.incompletos,
      icon: AlertCircle,
      description: 'Necessitam revisão',
      color: 'text-amber-600',
      bg: 'bg-amber-500/5',
      filterValue: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        const clickable = card.filterValue !== null
        const isActive = activeFilter === card.filterValue
        return (
          <div
            key={card.label}
            className={cn(
              'rounded-lg border bg-card p-4 transition-all',
              clickable && 'cursor-pointer hover:border-primary/30 hover:shadow-sm',
              isActive && 'border-primary/40 ring-1 ring-primary/20',
            )}
            onClick={clickable ? () => onFilter(card.filterValue!) : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn('rounded-md p-2', card.bg)}>
                <Icon size={16} className={card.color} />
              </div>
              <span className="text-2xl font-bold text-foreground tabular-nums">{card.value}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{card.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
          </div>
        )
      })}
    </div>
  )
}

import { Card } from '@/components/ui/card'
import { Users, ShieldCheck, UserCog, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  total: number
  admins: number
  colaboradores: number
  ativos: number
}

const cards = [
  {
    key: 'total',
    label: 'Total de Usuários',
    icon: Users,
    iconColor: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-l-primary',
  },
  {
    key: 'admins',
    label: 'Administradores',
    icon: ShieldCheck,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-l-amber-500',
  },
  {
    key: 'colaboradores',
    label: 'Colaboradores',
    icon: UserCog,
    iconColor: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-l-blue-500',
  },
  {
    key: 'ativos',
    label: 'Usuários Ativos',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bg: 'bg-green-500/10',
    border: 'border-l-green-500',
  },
]

export function StatsCards({ total, admins, colaboradores, ativos }: StatsCardsProps) {
  const values: Record<string, number> = { total, admins, colaboradores, ativos }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.key}
            className={cn(
              'p-5 shadow-sm border-l-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
              card.border,
            )}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-foreground">{values[card.key]}</p>
              </div>
              <div className={cn('rounded-full p-3', card.bg)}>
                <Icon size={22} className={card.iconColor} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

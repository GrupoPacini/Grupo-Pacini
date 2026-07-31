import { useMemo } from 'react'
import type { Client } from '@/services/api'
import { isClientIncomplete } from '@/lib/client-utils'
import { Card } from '@/components/ui/card'
import { Users, UserCheck, UserX, AlertTriangle } from 'lucide-react'

interface Props {
  clients: Client[]
}

export function ClientesIndicatorCards({ clients }: Props) {
  const cards = useMemo(
    () => [
      {
        label: 'Total de clientes',
        value: clients.length,
        desc: 'Todos os cadastros',
        icon: Users,
        color: 'text-primary',
      },
      {
        label: 'Clientes ativos',
        value: clients.filter((c) => c.client_status === 'Ativo').length,
        desc: 'Empresas em atendimento',
        icon: UserCheck,
        color: 'text-green-600',
      },
      {
        label: 'Clientes inativos',
        value: clients.filter((c) => c.client_status === 'Inativo').length,
        desc: 'Cadastros encerrados',
        icon: UserX,
        color: 'text-gray-500',
      },
      {
        label: 'Cadastros incompletos',
        value: clients.filter(isClientIncomplete).length,
        desc: 'Necessitam revisão',
        icon: AlertTriangle,
        color: 'text-amber-600',
      },
    ],
    [clients],
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
              <Icon size={16} className={card.color} />
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
          </Card>
        )
      })}
    </div>
  )
}

import { Client, Process } from '@/services/api'
import { License } from '@/services/licenses'
import { ClientResponsible } from '@/services/client-responsibles'
import { Socio } from '@/services/socios'
import { ClientCnae } from '@/services/client-cnaes'
import { Card } from '@/components/ui/card'
import { usePermissions } from '@/hooks/use-permissions'
import { getDaysRemaining } from '@/lib/license-utils'
import { format } from 'date-fns'
import {
  Building2,
  Scale,
  FileText,
  Activity,
  ShieldCheck,
  AlertCircle,
  Clock,
  Users,
  Tag,
  Calendar,
  UserCheck,
} from 'lucide-react'

interface Props {
  client: Client
  processes: Process[]
  licenses: License[]
  socios: Socio[]
  cnaes: ClientCnae[]
  responsibles: ClientResponsible[]
}

interface Indicator {
  label: string
  value: string | number
  icon: typeof Building2
  color: string
}

export function IndicatorCards({
  client,
  processes,
  licenses,
  socios,
  cnaes,
  responsibles,
}: Props) {
  const { canView } = usePermissions()

  const nearExpiry = licenses.filter((l) => {
    if (l.sem_vencimento || !l.expiration_date) return false
    const d = getDaysRemaining(l.expiration_date)
    return d !== null && d >= 0 && d <= 30
  })

  const indicators: Indicator[] = [
    {
      label: 'Status',
      value: client.onboarding_status || '—',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      label: 'Regime Tributário',
      value: client.tax_regime || '—',
      icon: Scale,
      color: 'text-purple-600',
    },
  ]

  if (canView('Processos')) {
    indicators.push(
      {
        label: 'Total de Processos',
        value: processes.length,
        icon: FileText,
        color: 'text-blue-600',
      },
      {
        label: 'Em Andamento',
        value: processes.filter((p) => p.status === 'Em Andamento').length,
        icon: Activity,
        color: 'text-amber-600',
      },
    )
  }

  if (canView('Licenças')) {
    indicators.push(
      {
        label: 'Licenças Ativas',
        value: licenses.filter((l) => l.status === 'Ativo').length,
        icon: ShieldCheck,
        color: 'text-green-600',
      },
      {
        label: 'Licenças Vencidas',
        value: licenses.filter((l) => l.status === 'Vencido').length,
        icon: AlertCircle,
        color: 'text-red-600',
      },
      {
        label: 'Próx. Vencimento',
        value: nearExpiry.length,
        icon: Clock,
        color: 'text-orange-600',
      },
    )
  }

  indicators.push(
    { label: 'Sócios', value: socios.length, icon: Users, color: 'text-cyan-600' },
    { label: 'CNAEs', value: cnaes.length, icon: Tag, color: 'text-indigo-600' },
    {
      label: 'Última Alteração',
      value: client.updated ? format(new Date(client.updated), 'dd/MM/yyyy') : '—',
      icon: Calendar,
      color: 'text-gray-600',
    },
    {
      label: 'Responsável',
      value: responsibles[0]?.expand?.user?.name || '—',
      icon: UserCheck,
      color: 'text-teal-600',
    },
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {indicators.map((ind, i) => {
        const Icon = ind.icon
        return (
          <Card key={i} className="p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={ind.color} />
              <span className="text-xs text-muted-foreground truncate">{ind.label}</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{ind.value}</p>
          </Card>
        )
      })}
    </div>
  )
}

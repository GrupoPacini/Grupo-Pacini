import { Client, Process } from '@/services/api'
import { License } from '@/services/licenses'
import { ClientResponsible } from '@/services/client-responsibles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePermissions } from '@/hooks/use-permissions'
import { getDaysRemaining } from '@/lib/license-utils'
import { differenceInDays } from 'date-fns'
import { AlertTriangle, AlertCircle, Clock, UserX, CheckCircle2, Lightbulb } from 'lucide-react'

interface Props {
  client: Client
  processes: Process[]
  licenses: License[]
  responsibles: ClientResponsible[]
}

interface Alert {
  icon: typeof AlertTriangle
  text: string
  color: string
}

export function SmartIndicatorsCard({ client, processes, licenses, responsibles }: Props) {
  const { canView } = usePermissions()
  const alerts: Alert[] = []

  const missing: string[] = []
  if (!client.cnpj) missing.push('CNPJ')
  if (!client.tax_regime) missing.push('Regime')
  if (!client.data_abertura) missing.push('Data de Abertura')
  if (missing.length > 0) {
    alerts.push({ icon: AlertTriangle, text: 'Cadastro incompleto', color: 'text-amber-600' })
  }

  if (canView('Licenças')) {
    const hasNearExpiry = licenses.some((l) => {
      if (l.sem_vencimento || !l.expiration_date) return false
      const d = getDaysRemaining(l.expiration_date)
      return d !== null && d >= 0 && d <= 30
    })
    if (hasNearExpiry) {
      alerts.push({
        icon: AlertCircle,
        text: 'Licença próxima do vencimento',
        color: 'text-orange-600',
      })
    }
  }

  if (canView('Processos')) {
    const hasStalled = processes.some((p) => {
      if (p.status === 'Concluído' || p.status === 'Atrasado' || !p.updated) return false
      return differenceInDays(new Date(), new Date(p.updated)) > 30
    })
    if (hasStalled) {
      alerts.push({ icon: Clock, text: 'Processo parado há muitos dias', color: 'text-red-600' })
    }
  }

  if (responsibles.length === 0) {
    alerts.push({ icon: UserX, text: 'Empresa sem responsável definido', color: 'text-red-600' })
  }

  const hasPending =
    licenses.some((l) => l.status === 'Vencido') || processes.some((p) => p.status === 'Atrasado')
  if (hasPending) {
    alerts.push({ icon: AlertTriangle, text: 'Pendências operacionais', color: 'text-red-600' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-500" /> Indicadores Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle2 size={16} /> Tudo em ordem
          </p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const Icon = alert.icon
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Icon size={16} className={alert.color} />
                  <span className="text-foreground">{alert.text}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

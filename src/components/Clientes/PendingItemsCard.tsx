import { Client, Process } from '@/services/api'
import { License } from '@/services/licenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { usePermissions } from '@/hooks/use-permissions'
import { getDaysRemaining } from '@/lib/license-utils'
import { differenceInDays } from 'date-fns'
import { AlertCircle, ArrowRight } from 'lucide-react'

interface Props {
  client: Client
  processes: Process[]
  licenses: License[]
}

interface PendingItem {
  priority: number
  text: string
  link?: string
}

export function PendingItemsCard({ client, processes, licenses }: Props) {
  const { canView } = usePermissions()
  const items: PendingItem[] = []

  if (canView('Licenças')) {
    licenses
      .filter((l) => l.status === 'Vencido' || l.status_operacional === 'Vencida')
      .forEach((l) => {
        items.push({
          priority: 1,
          text: `Licença vencida: ${l.name}`,
          link: `/licencas?clientId=${client.id}`,
        })
      })
    licenses.forEach((l) => {
      if (l.sem_vencimento || !l.expiration_date) return
      const d = getDaysRemaining(l.expiration_date)
      if (d !== null && d >= 0 && d <= 30) {
        items.push({
          priority: 2,
          text: `Licença próxima do vencimento: ${l.name}`,
          link: `/licencas?clientId=${client.id}`,
        })
      }
    })
  }

  if (canView('Processos')) {
    processes
      .filter((p) => p.status === 'Atrasado')
      .forEach((p) => {
        items.push({
          priority: 1,
          text: `Processo atrasado: ${p.title}`,
          link: `/processos?clientId=${client.id}`,
        })
      })
    processes.forEach((p) => {
      if (!p.due_date || p.status === 'Concluído') return
      const d = differenceInDays(new Date(p.due_date), new Date())
      if (d >= 0 && d <= 7) {
        items.push({
          priority: 2,
          text: `Processo vence em breve: ${p.title}`,
          link: `/processos?clientId=${client.id}`,
        })
      }
    })
  }

  const missing: string[] = []
  if (!client.cnpj) missing.push('CNPJ')
  if (!client.tax_regime) missing.push('Regime Tributário')
  if (!client.data_abertura) missing.push('Data de Abertura')
  if (!client.municipio) missing.push('Município')
  if (!client.estado) missing.push('Estado')
  if (missing.length > 0) {
    items.push({ priority: 3, text: `Cadastro incompleto: ${missing.join(', ')}` })
  }

  items.sort((a, b) => a.priority - b.priority)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-600" /> Pendências
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma pendência encontrada.
          </p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2"
              >
                <span className="text-sm text-foreground">{item.text}</span>
                {item.link && (
                  <Link to={item.link}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0">
                      <ArrowRight size={14} />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

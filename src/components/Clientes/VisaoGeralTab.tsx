import { Client, Process } from '@/services/api'
import { ClientResponsible } from '@/services/client-responsibles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Building2, FileText, ShieldCheck, Activity } from 'lucide-react'

interface Props {
  client: Client
  processes: Process[]
  licenses: any[]
  responsibles: ClientResponsible[]
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || '—'}</span>
    </div>
  )
}

export function VisaoGeralTab({ client, processes, licenses, responsibles }: Props) {
  const activeLicenses = licenses.filter((l) => l.status === 'Ativo')
  const responsibleName = responsibles[0]?.expand?.user?.name || '—'
  const allDates = [
    client.updated,
    ...processes.map((p) => p.updated),
    ...licenses.map((l) => l.updated),
  ].filter(Boolean)
  const lastMoviment = allDates.sort().reverse()[0]

  const stats = [
    {
      label: 'Processos',
      value: processes.length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Licenças Ativas',
      value: activeLicenses.length,
      icon: ShieldCheck,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Última Movimentação',
      value: lastMoviment ? format(new Date(lastMoviment), 'dd/MM/yyyy') : '—',
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Informações Principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <InfoRow label="Razão Social" value={client.razao_social || client.name} />
          <InfoRow label="Nome Fantasia" value={client.nome_fantasia || client.alias} />
          <InfoRow label="CNPJ" value={client.cnpj} />
          <InfoRow label="Situação Cadastral" value={client.situacao_cadastral} />
          <InfoRow label="Regime Tributário" value={client.tax_regime} />
          <InfoRow
            label="Data de Abertura"
            value={client.data_abertura ? format(new Date(client.data_abertura), 'dd/MM/yyyy') : ''}
          />
          <InfoRow label="Responsável Interno" value={responsibleName} />
          <InfoRow label="Status" value={client.onboarding_status} />
          <InfoRow
            label="Última Atualização"
            value={
              client.updated
                ? format(new Date(client.updated), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : '—'
            }
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2.5 ${s.bg}`}>
                    <Icon size={18} className={s.color} />
                  </div>
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <span className="text-lg font-bold text-foreground">{s.value}</span>
              </div>
            )
          })}
          {client.onboarding_status && (
            <div className="pt-2 border-t border-border">
              <Badge variant="outline" className="w-full justify-center py-1.5">
                <Building2 size={12} className="mr-1.5" /> {client.onboarding_status}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

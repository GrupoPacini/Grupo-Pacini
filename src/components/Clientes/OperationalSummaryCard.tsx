import { Client } from '@/services/api'
import { License } from '@/services/licenses'
import { ClientResponsible } from '@/services/client-responsibles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Briefcase, Calculator, Wallet, Building } from 'lucide-react'

interface Props {
  client: Client
  licenses: License[]
  responsibles: ClientResponsible[]
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border last:border-0 pb-3 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="space-y-1 pl-6">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value || '—'}</span>
    </div>
  )
}

export function OperationalSummaryCard({ client, licenses, responsibles }: Props) {
  const activeLicenses = licenses.filter((l) => l.status === 'Ativo').length
  const pendingRenewals = licenses.filter((l) => l.status === 'Renovando').length
  const protocolsInProgress = licenses.filter(
    (l) => l.etapa_renovacao && l.etapa_renovacao !== 'Concluída',
  ).length
  const responsibleName = responsibles[0]?.expand?.user?.name || '—'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Operacional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Section icon={Briefcase} title="Legal">
          <Row label="Licenças Ativas" value={String(activeLicenses)} />
          <Row label="Renovações Pendentes" value={String(pendingRenewals)} />
          <Row label="Protocolos em Andamento" value={String(protocolsInProgress)} />
        </Section>
        <Section icon={Building} title="Fiscal">
          <Row label="Regime Tributário" value={client.tax_regime} />
          <Row label="Situação Cadastral" value={client.situacao_cadastral} />
        </Section>
        <Section icon={Calculator} title="Contábil">
          <Row label="Responsável" value={responsibleName} />
          <Row
            label="Última Atualização"
            value={client.updated ? format(new Date(client.updated), 'dd/MM/yyyy') : '—'}
          />
        </Section>
        <Section icon={Wallet} title="Financeiro">
          <p className="text-xs text-muted-foreground italic">
            Módulo Financeiro disponível em breve.
          </p>
        </Section>
      </CardContent>
    </Card>
  )
}

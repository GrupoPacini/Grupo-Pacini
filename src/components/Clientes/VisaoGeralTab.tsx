import { Client, Process } from '@/services/api'
import { License } from '@/services/licenses'
import { ClientResponsible } from '@/services/client-responsibles'
import { Socio } from '@/services/socios'
import { ClientCnae } from '@/services/client-cnaes'
import { IndicatorCards } from '@/components/Clientes/IndicatorCards'
import { PendingItemsCard } from '@/components/Clientes/PendingItemsCard'
import { OperationalSummaryCard } from '@/components/Clientes/OperationalSummaryCard'
import { RecentHistoryCard } from '@/components/Clientes/RecentHistoryCard'
import { SmartIndicatorsCard } from '@/components/Clientes/SmartIndicatorsCard'

interface Props {
  client: Client
  processes: Process[]
  licenses: License[]
  responsibles: ClientResponsible[]
  socios: Socio[]
  cnaes: ClientCnae[]
  clientId: string
}

export function VisaoGeralTab({
  client,
  processes,
  licenses,
  responsibles,
  socios,
  cnaes,
  clientId,
}: Props) {
  return (
    <div className="space-y-4">
      <IndicatorCards
        client={client}
        processes={processes}
        licenses={licenses}
        socios={socios}
        cnaes={cnaes}
        responsibles={responsibles}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PendingItemsCard client={client} processes={processes} licenses={licenses} />
        <SmartIndicatorsCard
          client={client}
          processes={processes}
          licenses={licenses}
          responsibles={responsibles}
        />
      </div>
      <OperationalSummaryCard client={client} licenses={licenses} responsibles={responsibles} />
      <RecentHistoryCard clientId={clientId} />
    </div>
  )
}

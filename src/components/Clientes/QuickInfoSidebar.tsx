import { Client } from '@/services/api'
import { ClientResponsible } from '@/services/client-responsibles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, ShieldCheck, RefreshCw, Pencil, History } from 'lucide-react'

interface Props {
  client: Client
  responsibles: ClientResponsible[]
  canEdit: boolean
  canView: (module: string) => boolean
  onNavigate: (tab: string) => void
}

function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">{value || '—'}</span>
    </div>
  )
}

export function QuickInfoSidebar({ client, responsibles, canEdit, canView, onNavigate }: Props) {
  const responsibleName = responsibles[0]?.expand?.user?.name || '—'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Informações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow label="CNPJ" value={formatCNPJ(client.cnpj)} />
          <InfoRow label="Situação Cadastral" value={client.situacao_cadastral} />
          <InfoRow label="Natureza Jurídica" value={client.natureza_juridica} />
          <InfoRow label="Porte" value={client.porte} />
          <InfoRow
            label="Data de Abertura"
            value={client.data_abertura ? format(new Date(client.data_abertura), 'dd/MM/yyyy') : ''}
          />
          <InfoRow label="Município" value={client.municipio} />
          <InfoRow label="Estado" value={client.estado} />
          <InfoRow label="Responsável" value={responsibleName} />
          <InfoRow
            label="Última Alteração"
            value={
              client.updated ? format(new Date(client.updated), 'dd/MM/yyyy', { locale: ptBR }) : ''
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {canView('Processos') && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link to={`/processos?clientId=${client.id}`}>
                <FileText size={14} /> Processos
              </Link>
            </Button>
          )}
          {canView('Licenças') && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link to={`/licencas?clientId=${client.id}`}>
                <ShieldCheck size={14} /> Licenças
              </Link>
            </Button>
          )}
          {canView('Renovações') && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link to={`/renovacoes?clientId=${client.id}`}>
                <RefreshCw size={14} /> Renovações
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => onNavigate('timeline')}
          >
            <History size={14} /> Histórico
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

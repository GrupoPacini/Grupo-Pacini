import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ClientActions } from '@/components/Clientes/ClientActions'
import {
  type ClientRecord,
  maskCNPJ,
  getDisplayStatus,
  statusBadgeClass,
  regimeBadgeClass,
} from '@/lib/client-utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SearchX } from 'lucide-react'

interface Props {
  clients: ClientRecord[]
  loading: boolean
  onRowClick: (client: ClientRecord) => void
  onStatusChange: (client: ClientRecord) => void
  canEdit: boolean
  canManage: boolean
  hasFilters: boolean
  onClearFilters: () => void
}

export function ClientTable({
  clients,
  loading,
  onRowClick,
  onStatusChange,
  canEdit,
  canManage,
  hasFilters,
  onClearFilters,
}: Props) {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="py-16 text-center">
        <SearchX className="mx-auto mb-3 text-muted-foreground" size={32} />
        <p className="text-sm text-muted-foreground mb-3">
          {hasFilters
            ? 'Nenhum cliente encontrado com os filtros aplicados.'
            : 'Nenhum cliente cadastrado.'}
        </p>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
            <TableHead className="font-semibold text-muted-foreground">CNPJ</TableHead>
            <TableHead className="font-semibold text-muted-foreground">Regime Tributário</TableHead>
            <TableHead className="font-semibold text-muted-foreground">
              Responsável Interno
            </TableHead>
            <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="font-semibold text-muted-foreground">Atualização</TableHead>
            <TableHead className="text-right font-semibold text-muted-foreground pr-4">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c) => {
            const displayStatus = getDisplayStatus(c)
            const responsavel = c.expand?.responsavel_interno?.name
            return (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => onRowClick(c)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground line-clamp-1">
                      {c.razao_social || c.name}
                    </span>
                    {(c.nome_fantasia || c.alias) && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {c.nome_fantasia || c.alias}
                      </span>
                    )}
                    {c.code && (
                      <span className="text-xs text-muted-foreground/70 font-mono">{c.code}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground font-mono">
                    {c.cnpj ? maskCNPJ(c.cnpj) : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  {c.tax_regime ? (
                    <Badge variant="outline" className={regimeBadgeClass(c.tax_regime)}>
                      {c.tax_regime}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground">{responsavel || '—'}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadgeClass(displayStatus)}>
                    {displayStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {c.updated ? format(new Date(c.updated), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                  <ClientActions
                    client={c}
                    onStatusChange={onStatusChange}
                    canEdit={canEdit}
                    canManage={canManage}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

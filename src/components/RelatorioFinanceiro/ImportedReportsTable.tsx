import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Eye, RefreshCw, Trash2, Inbox, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatBRL,
  formatCompetence,
  getImportStatusConfig,
  type FinancialReportImport,
} from '@/lib/financial-utils'
import type { ClientRecord } from '@/services/clients'

interface ImportedReportsTableProps {
  imports: FinancialReportImport[]
  clients: ClientRecord[]
  loading: boolean
  canDelete: boolean
  canEdit: boolean
  onView: (clientId: string, month: number, year: number) => void
  onReimport: (clientId: string, month: number, year: number) => void
  onEditOpeningBalance: (importRecord: FinancialReportImport) => void
  onDelete: (importRecord: FinancialReportImport) => void
}

function getClientName(imp: FinancialReportImport, clients: ClientRecord[]): string {
  const expanded = imp.expand?.client
  if (expanded) return expanded.razao_social || expanded.name
  const c = clients.find((cl) => cl.id === imp.client)
  return c ? c.razao_social || c.name : '—'
}

function getImporterName(imp: FinancialReportImport): string {
  return imp.expand?.imported_by?.name || '—'
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ImportedReportsTable({
  imports,
  clients,
  loading,
  canDelete,
  canEdit,
  onView,
  onReimport,
  onEditOpeningBalance,
  onDelete,
}: ImportedReportsTableProps) {
  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">Relatórios Importados</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-2 text-primary/60" />
            <p className="text-sm">Carregando relatórios...</p>
          </div>
        ) : imports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Inbox size={24} className="mb-2 text-muted-foreground/40" />
            <p className="text-sm">Nenhum relatório importado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs">Competência</TableHead>
                  <TableHead className="text-xs">Saldo Inicial</TableHead>
                  <TableHead className="text-xs">Arquivo</TableHead>
                  <TableHead className="text-xs text-center">Registros</TableHead>
                  <TableHead className="text-xs">Importado por</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((imp) => {
                  const statusCfg = getImportStatusConfig(imp.status)
                  return (
                    <TableRow key={imp.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-sm font-medium">
                        {getClientName(imp, clients)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatCompetence(imp.month, imp.year)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {imp.opening_balance != null ? formatBRL(imp.opening_balance) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {imp.file_name || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-center">{imp.record_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getImporterName(imp)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateBR(imp.imported_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            statusCfg.badge,
                          )}
                        >
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onView(imp.client, imp.month, imp.year)}
                            title="Visualizar"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onReimport(imp.client, imp.month, imp.year)}
                            title="Reimportar"
                          >
                            <RefreshCw size={14} />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => onEditOpeningBalance(imp)}
                              title="Editar saldo inicial"
                            >
                              <Pencil size={14} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => onDelete(imp)}
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

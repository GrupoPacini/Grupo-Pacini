import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  formatCompetence,
  getImportStatusConfig,
  type FinancialReportImport,
} from '@/lib/financial-utils'
import type { ClientRecord } from '@/services/clients'

interface DeleteReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importRecord: FinancialReportImport | null
  clients: ClientRecord[]
  loading: boolean
  onConfirm: () => void
}

export function DeleteReportDialog({
  open,
  onOpenChange,
  importRecord,
  clients,
  loading,
  onConfirm,
}: DeleteReportDialogProps) {
  if (!importRecord) return null

  const client = clients.find((c) => c.id === importRecord.client)
  const clientName = client ? client.razao_social || client.name : '—'
  const competence = formatCompetence(importRecord.month, importRecord.year)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Relatório Financeiro</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-3 py-4">
          <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              Tem certeza de que deseja excluir o relatório financeiro de{' '}
              <strong>{competence}</strong> deste cliente? Essa ação removerá todos os lançamentos
              vinculados a essa importação.
            </p>
            <p className="text-xs text-muted-foreground">
              Cliente: {clientName} • {importRecord.record_count || 0} registro(s)
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

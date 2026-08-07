import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateOpeningBalance } from '@/services/financial-report-imports'
import {
  formatBRLInput,
  numberToBRLInput,
  parseBRLInput,
  formatCompetence,
  type FinancialReportImport,
} from '@/lib/financial-utils'
import type { ClientRecord } from '@/services/clients'

interface EditOpeningBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importRecord: FinancialReportImport | null
  clients: ClientRecord[]
  onUpdated: () => void
}

export function EditOpeningBalanceDialog({
  open,
  onOpenChange,
  importRecord,
  clients,
  onUpdated,
}: EditOpeningBalanceDialogProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && importRecord) {
      const ob = importRecord.opening_balance
      setValue(ob != null ? numberToBRLInput(ob) : '')
    } else {
      setValue('')
      setLoading(false)
    }
  }, [open, importRecord])

  if (!importRecord) return null

  const client = clients.find((c) => c.id === importRecord.client)
  const clientName = client ? client.razao_social || client.name : '—'
  const competence = formatCompetence(importRecord.month, importRecord.year)

  const handleSave = async () => {
    if (!value) {
      toast.error('Informe o saldo inicial.')
      return
    }
    setLoading(true)
    try {
      const numValue = parseBRLInput(value)
      await updateOpeningBalance(importRecord.id, numValue)
      toast.success('Saldo inicial atualizado com sucesso.')
      onUpdated()
      onOpenChange(false)
    } catch (err: any) {
      const status = err?.status || err?.originalStatus
      if (status === 403) {
        toast.error('Você não tem permissão para editar relatórios financeiros.')
      } else if (status === 404) {
        toast.error('Relatório financeiro não encontrado.')
      } else {
        toast.error(err?.message || 'Erro ao atualizar saldo inicial.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Saldo Inicial</DialogTitle>
          <DialogDescription>
            Informe o saldo inicial para o relatório de {competence} — {clientName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Saldo Inicial *</Label>
            <Input
              value={value}
              onChange={(e) => setValue(formatBRLInput(e.target.value))}
              placeholder="R$ 0,00"
              inputMode="numeric"
            />
            <p className="text-xs text-muted-foreground">
              Digite o valor do saldo inicial. Aceita valores negativos (use o sinal de menos).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !value}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

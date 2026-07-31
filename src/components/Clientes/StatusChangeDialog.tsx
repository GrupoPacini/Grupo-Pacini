import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateClientRecord } from '@/services/clients'
import { type ClientRecord, statusBadgeClass } from '@/lib/client-utils'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

const STATUSES = ['Ativo', 'Inativo']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientRecord | null
  onSuccess: () => void
}

export function StatusChangeDialog({ open, onOpenChange, client, onSuccess }: Props) {
  const [newStatus, setNewStatus] = useState('')
  const [motivo, setMotivo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && client) {
      setNewStatus(client.client_status || 'Ativo')
      setMotivo(client.motivo_inativacao || '')
    }
  }, [open, client])

  const currentStatus = client?.client_status || 'Ativo'
  const isChanging = newStatus !== currentStatus
  const isInactivating = newStatus === 'Inativo' && isChanging

  const handleSubmit = async () => {
    if (!client || !isChanging) return
    setSubmitting(true)
    try {
      await updateClientRecord(client.id, {
        client_status: newStatus,
        motivo_inativacao: newStatus === 'Inativo' ? motivo.trim() : '',
      })
      toast.success('Status alterado com sucesso')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao alterar status')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Alterar Status do Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <p className="text-sm font-medium text-foreground">
              {client?.razao_social || client?.name}
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status atual</Label>
            <div>
              <Badge variant="outline" className={statusBadgeClass(currentStatus)}>
                {currentStatus}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Novo status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isInactivating && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Motivo da inativação (opcional)</Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Descreva o motivo da inativação..."
                rows={3}
              />
            </div>
          )}
          {isChanging && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                {isInactivating
                  ? 'O cliente será inativado. Seus dados, processos, licenças e histórico serão preservados.'
                  : 'O cliente será reativado e voltará a aparecer na lista de ativos.'}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !isChanging}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? 'Salvando...' : 'Confirmar alteração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

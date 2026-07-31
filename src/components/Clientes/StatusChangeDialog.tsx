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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, updateClient } from '@/services/api'
import { toast } from 'sonner'

const STATUSES = ['Lead', 'Documentação', 'Configuração', 'Ativo']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSuccess: () => void
}

export function StatusChangeDialog({ open, onOpenChange, client, onSuccess }: Props) {
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && client) {
      setStatus(client.onboarding_status || '')
    }
  }, [open, client])

  const handleSubmit = async () => {
    if (!client) return
    setSubmitting(true)
    try {
      await updateClient(client.id, { onboarding_status: status })
      toast.success('Status Atualizado Com Sucesso')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro Ao Atualizar Status')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Alterar Status Do Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status de Onboarding — {client?.name}</Label>
            <Select
              value={status || '__none__'}
              onValueChange={(v) => setStatus(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

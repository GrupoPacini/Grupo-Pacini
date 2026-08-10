import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProcessStage, createStage, updateStage } from '@/services/process-stages'
import { STAGE_STATUSES } from '@/lib/process-utils'
import { toast } from 'sonner'

interface StageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  processId: string
  editingStage?: ProcessStage | null
  nextOrder: number
  onSuccess: () => void
}

export function StageFormDialog({
  open,
  onOpenChange,
  processId,
  editingStage,
  nextOrder,
  onSuccess,
}: StageFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState('Não iniciado')

  useEffect(() => {
    if (editingStage) {
      setName(editingStage.name)
      setStatus(editingStage.status || 'Não iniciado')
    } else {
      setName('')
      setStatus('Não iniciado')
    }
  }, [editingStage, open])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      if (editingStage) {
        await updateStage(editingStage.id, { name, status })
        toast.success('Etapa Atualizada')
      } else {
        await createStage({ process: processId, name, order: nextOrder, status })
        toast.success('Etapa Criada')
      }
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro Ao Salvar Etapa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Etapa</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Coleta de documentos"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGE_STATUSES.map((s) => (
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
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

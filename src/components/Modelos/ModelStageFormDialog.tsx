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
import { Textarea } from '@/components/ui/textarea'
import {
  ProcessModelStage,
  createModelStage,
  updateModelStage,
} from '@/services/process-model-stages'
import { toast } from 'sonner'

interface ModelStageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelId: string
  editingStage?: ProcessModelStage | null
  nextOrder: number
  onSuccess: () => void
}

export function ModelStageFormDialog({
  open,
  onOpenChange,
  modelId,
  editingStage,
  nextOrder,
  onSuccess,
}: ModelStageFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (editingStage) {
      setName(editingStage.name)
      setDescription(editingStage.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [editingStage, open])

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      if (editingStage) {
        await updateModelStage(editingStage.id, { name, description })
        toast.success('Etapa Atualizada')
      } else {
        await createModelStage({ model: modelId, name, order: nextOrder, description })
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Etapa *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Coleta de informações"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da etapa (opcional)"
              className="min-h-[60px] resize-none"
            />
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

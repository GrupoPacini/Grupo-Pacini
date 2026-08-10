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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProcessModelTask, createModelTask, updateModelTask } from '@/services/process-model-tasks'
import { getUsers } from '@/services/api'
import type { User } from '@/services/api'
import { toast } from 'sonner'

interface ModelTaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  editingTaskId?: string | null
  tasks: ProcessModelTask[]
  onSuccess: () => void
}

export function ModelTaskFormDialog({
  open,
  onOpenChange,
  stageId,
  editingTaskId,
  tasks,
  onSuccess,
}: ModelTaskFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    default_due_days: '',
    default_responsible: '',
    required: 'sim',
  })

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const editing = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null
    if (editing) {
      setForm({
        name: editing.name || '',
        description: editing.description || '',
        default_due_days: editing.default_due_days?.toString() || '',
        default_responsible: editing.default_responsible || '',
        required: editing.required || 'sim',
      })
    } else {
      setForm({
        name: '',
        description: '',
        default_due_days: '',
        default_responsible: '',
        required: 'sim',
      })
    }
  }, [editingTaskId, tasks, open])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const nextOrder = editingTaskId
        ? tasks.find((t) => t.id === editingTaskId)?.order || 0
        : tasks.length > 0
          ? Math.max(...tasks.map((t) => t.order || 0)) + 1
          : 0

      const data: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        default_due_days: form.default_due_days ? parseInt(form.default_due_days, 10) : undefined,
        default_responsible: form.default_responsible || undefined,
        required: form.required,
        order: nextOrder,
      }

      if (editingTaskId) {
        const { name: _n, ...updateData } = data as any
        await updateModelTask(editingTaskId, { ...updateData, name: form.name })
        toast.success('Tarefa Atualizada')
      } else {
        await createModelTask({ ...data, stage: stageId } as any)
        toast.success('Tarefa Criada')
      }
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro Ao Salvar Tarefa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Enviar guia de ICMS"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição da tarefa (opcional)"
              className="min-h-[60px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prazo Padrão (dias)</Label>
              <Input
                type="number"
                value={form.default_due_days}
                onChange={(e) => setForm({ ...form, default_due_days: e.target.value })}
                placeholder="Ex: 5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Obrigatória</Label>
              <Select
                value={form.required}
                onValueChange={(v) => setForm({ ...form, required: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Responsável Padrão</Label>
            <Select
              value={form.default_responsible}
              onValueChange={(v) => setForm({ ...form, default_responsible: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
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

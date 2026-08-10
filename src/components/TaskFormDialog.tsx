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
import { ProcessTask, createTask, updateTask } from '@/services/process-tasks'
import type { User } from '@/services/api'
import { TASK_STATUSES } from '@/lib/process-utils'
import { toast } from 'sonner'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  editingTask?: ProcessTask | null
  users: User[]
  onSuccess: () => void
}

export function TaskFormDialog({
  open,
  onOpenChange,
  stageId,
  editingTask,
  users,
  onSuccess,
}: TaskFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    responsible: '',
    due_date: '',
    status: 'Pendente',
    observation: '',
  })

  useEffect(() => {
    if (editingTask) {
      setForm({
        name: editingTask.name || '',
        responsible: editingTask.responsible || '',
        due_date: editingTask.due_date || '',
        status: editingTask.status || 'Pendente',
        observation: editingTask.observation || '',
      })
    } else {
      setForm({ name: '', responsible: '', due_date: '', status: 'Pendente', observation: '' })
    }
  }, [editingTask, open])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const data: Record<string, string> = { ...form }
      if (!data.responsible) delete data.responsible
      if (!data.due_date) delete data.due_date
      if (editingTask) {
        await updateTask(editingTask.id, data)
        toast.success('Tarefa Atualizada')
      } else {
        await createTask({ ...data, stage: stageId })
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Enviar guia de ICMS"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Responsável</Label>
              <Select
                value={form.responsible}
                onValueChange={(v) => setForm({ ...form, responsible: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prazo</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observação</Label>
            <Textarea
              value={form.observation}
              onChange={(e) => setForm({ ...form, observation: e.target.value })}
              placeholder="Observações (opcional)"
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

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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ProcessTask, createTask, updateTask } from '@/services/process-tasks'
import type { User } from '@/services/api'
import { TASK_STATUSES, TASK_PRIORITIES, TASK_DEADLINE_BASES } from '@/lib/process-utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ChevronsUpDown } from 'lucide-react'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stageId: string
  editingTask?: ProcessTask | null
  users: User[]
  tasks: ProcessTask[]
  onSuccess: () => void
}

interface TaskFormState {
  name: string
  description: string
  responsible: string
  due_days: string
  due_date: string
  priority: string
  order: string
  required: string
  status: string
  active: boolean
  deadline_basis: string
  dependency: string[]
  observation: string
}

const emptyForm: TaskFormState = {
  name: '',
  description: '',
  responsible: '',
  due_days: '',
  due_date: '',
  priority: 'Baixa',
  order: '',
  required: 'sim',
  status: 'Pendente',
  active: true,
  deadline_basis: 'stage_start',
  dependency: [],
  observation: '',
}

export function TaskFormDialog({
  open,
  onOpenChange,
  stageId,
  editingTask,
  users,
  tasks,
  onSuccess,
}: TaskFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<TaskFormState>(emptyForm)
  const [depOpen, setDepOpen] = useState(false)

  useEffect(() => {
    if (editingTask) {
      setForm({
        name: editingTask.name || '',
        description: editingTask.description || '',
        responsible: editingTask.responsible || '',
        due_days: editingTask.due_days?.toString() || '',
        due_date: editingTask.due_date || '',
        priority: editingTask.priority || 'Baixa',
        order: editingTask.order?.toString() || '',
        required: editingTask.required || 'sim',
        status: editingTask.status || 'Pendente',
        active: editingTask.active !== false,
        deadline_basis: editingTask.deadline_basis || 'stage_start',
        dependency: Array.isArray(editingTask.dependency) ? editingTask.dependency : [],
        observation: editingTask.observation || '',
      })
    } else {
      const nextOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order || 0)) + 1 : 0
      setForm({ ...emptyForm, order: nextOrder.toString() })
    }
  }, [editingTask, open, tasks])

  const availableTasks = tasks.filter((t) => t.id !== editingTask?.id)

  const set = <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleDependency = (taskId: string) => {
    setForm((prev) => ({
      ...prev,
      dependency: prev.dependency.includes(taskId)
        ? prev.dependency.filter((id) => id !== taskId)
        : [...prev.dependency, taskId],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const data: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        responsible: form.responsible || null,
        due_days: form.due_days ? Number(form.due_days) : null,
        due_date: form.due_date || null,
        priority: form.priority,
        order: form.order ? Number(form.order) : 0,
        required: form.required,
        status: form.status,
        active: form.active,
        deadline_basis: form.deadline_basis,
        dependency: form.dependency,
        observation: form.observation || undefined,
      }
      if (editingTask) {
        await updateTask(editingTask.id, data)
        toast.success('Tarefa Atualizada')
      } else {
        await createTask({ ...data, stage: stageId } as Parameters<typeof createTask>[0])
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Enviar guia de ICMS"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descrição da tarefa (opcional)"
              className="min-h-[50px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Responsável</Label>
              <Select value={form.responsible} onValueChange={(v) => set('responsible', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prazo Padrão (dias)</Label>
              <Input
                type="number"
                value={form.due_days}
                onChange={(e) => set('due_days', e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Limite</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ordem</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Obrigatória</Label>
              <Select value={form.required} onValueChange={(v) => set('required', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between space-y-0 pt-6">
              <Label className="text-sm font-medium">Ativa</Label>
              <Switch checked={form.active} onCheckedChange={(checked) => set('active', checked)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Base do Prazo</Label>
            <Select value={form.deadline_basis} onValueChange={(v) => set('deadline_basis', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_DEADLINE_BASES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Depende de outra tarefa</Label>
            <Popover open={depOpen} onOpenChange={setDepOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {form.dependency.length > 0
                    ? `${form.dependency.length} tarefa(s) selecionada(s)`
                    : 'Nenhuma dependência'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {availableTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">
                      Nenhuma tarefa disponível
                    </p>
                  ) : (
                    availableTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleDependency(t.id)}
                        className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted text-sm text-left"
                      >
                        <Checkbox
                          checked={form.dependency.includes(t.id)}
                          className="pointer-events-none"
                        />
                        <span className="flex-1">{t.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observação</Label>
            <Textarea
              value={form.observation}
              onChange={(e) => set('observation', e.target.value)}
              placeholder="Observações (opcional)"
              className="min-h-[50px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { Process, Client, Department, User, createProcess, updateProcess } from '@/services/api'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { PROCESS_STATUSES, PRIORITIES } from '@/lib/process-utils'
import { getActiveModels } from '@/services/process-models'
import type { ProcessModel } from '@/services/process-models'
import { getStagesByModel } from '@/services/process-model-stages'
import { createStage } from '@/services/process-stages'
import { createTask } from '@/services/process-tasks'
import { addDays, format } from 'date-fns'
import { toast } from 'sonner'

interface ProcessFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  departments: Department[]
  users: User[]
  editingProcess?: Process | null
  onSuccess: () => void
}

const emptyForm = {
  title: '',
  client: '',
  department: '',
  responsible: '',
  start_date: '',
  due_date: '',
  priority: 'Média',
  notes: '',
  status: 'Não iniciado',
}

export function ProcessFormDialog({
  open,
  onOpenChange,
  clients,
  departments,
  users,
  editingProcess,
  onSuccess,
}: ProcessFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState(emptyForm)
  const [models, setModels] = useState<ProcessModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')

  useEffect(() => {
    if (editingProcess) {
      setForm({
        title: editingProcess.title || '',
        client: editingProcess.client || '',
        department: editingProcess.department || '',
        responsible: editingProcess.responsible || '',
        start_date: editingProcess.start_date || '',
        due_date: editingProcess.due_date || '',
        priority: editingProcess.priority || 'Média',
        notes: editingProcess.notes || '',
        status: editingProcess.status || 'Não iniciado',
      })
    } else {
      setForm(emptyForm)
    }
    setFieldErrors({})
    setSelectedModel('')
    if (open && !editingProcess) {
      getActiveModels()
        .then(setModels)
        .catch(() => {})
    }
  }, [editingProcess, open])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      const data = { ...form }
      if (!data.client) delete (data as any).client
      if (!data.department) delete (data as any).department
      if (!data.responsible) delete (data as any).responsible
      if (!data.start_date) delete (data as any).start_date
      if (!data.due_date) delete (data as any).due_date
      if (editingProcess) {
        await updateProcess(editingProcess.id, data)
        toast.success('Processo Atualizado Com Sucesso')
      } else {
        const result: any = await createProcess(data)
        if (selectedModel && result?.id) {
          try {
            const modelStages = await getStagesByModel(selectedModel)
            for (const stage of modelStages) {
              const newStage: any = await createStage({
                process: result.id,
                name: stage.name,
                order: stage.order || 0,
                status: 'Não iniciado',
              })
              const tasks = stage.expand?.process_model_tasks || []
              for (const task of tasks) {
                let dueDate = ''
                if (form.start_date && task.default_due_days) {
                  dueDate = format(
                    addDays(new Date(form.start_date), task.default_due_days),
                    'yyyy-MM-dd',
                  )
                }
                await createTask({
                  stage: newStage.id,
                  name: task.name,
                  responsible: task.default_responsible || undefined,
                  due_date: dueDate || undefined,
                  status: 'Pendente',
                  observation: task.description || undefined,
                })
              }
            }
            toast.success('Processo Criado Com Modelo Aplicado')
          } catch {
            toast.warning('Processo Criado, Mas Houve Erro Ao Copiar Etapas Do Modelo')
          }
        } else {
          toast.success('Processo Criado Com Sucesso')
        }
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(editingProcess ? 'Erro Ao Atualizar' : 'Erro Ao Criar Processo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingProcess ? 'Editar Processo' : 'Novo Processo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Descrição do processo"
            />
            {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
          </div>
          {!editingProcess && models.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Usar Modelo (opcional)</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo para preencher etapas e tarefas" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cliente</Label>
              <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.client && (
                <p className="text-sm text-destructive">{fieldErrors.client}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Departamento</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm({ ...form, department: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data de Início</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prazo</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
              {fieldErrors.due_date && (
                <p className="text-sm text-destructive">{fieldErrors.due_date}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCESS_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações adicionais (opcional)"
              className="min-h-[80px] resize-none"
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
            {submitting ? 'Salvando...' : editingProcess ? 'Salvar Alterações' : 'Criar Processo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

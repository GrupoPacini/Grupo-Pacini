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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProcessStage, createStage, updateStage } from '@/services/process-stages'
import { STAGE_STATUSES, PRIORITIES } from '@/lib/process-utils'
import type { Department } from '@/services/api'
import type { User } from '@/services/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  processId: string
  editingStage?: ProcessStage | null
  nextOrder: number
  departments: Department[]
  users: User[]
  onSuccess: () => void
}

const COLOR_PRESETS = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
]

interface StageFormState {
  name: string
  description: string
  order: string
  department: string
  default_responsible: string
  default_due_days: string
  priority: string
  status: string
  identification_color: string
  required: string
  active: boolean
}

const emptyForm: StageFormState = {
  name: '',
  description: '',
  order: '',
  department: 'none',
  default_responsible: 'none',
  default_due_days: '',
  priority: 'Média',
  status: 'Não iniciada',
  identification_color: '',
  required: 'não',
  active: true,
}

export function StageFormDialog({
  open,
  onOpenChange,
  processId,
  editingStage,
  nextOrder,
  departments,
  users,
  onSuccess,
}: StageFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<StageFormState>(emptyForm)

  useEffect(() => {
    if (editingStage) {
      setForm({
        name: editingStage.name || '',
        description: editingStage.description || '',
        order: editingStage.order?.toString() || '',
        department: editingStage.department || 'none',
        default_responsible: editingStage.default_responsible || 'none',
        default_due_days: editingStage.default_due_days?.toString() || '',
        priority: editingStage.priority || 'Média',
        status: editingStage.status || 'Não iniciada',
        identification_color: editingStage.identification_color || '',
        required: editingStage.required || 'não',
        active: editingStage.active !== false,
      })
    } else {
      setForm({ ...emptyForm, order: nextOrder.toString() })
    }
  }, [editingStage, open, nextOrder])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const data: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        order: form.order ? Number(form.order) : 0,
        department: form.department !== 'none' ? form.department : null,
        default_responsible: form.default_responsible !== 'none' ? form.default_responsible : null,
        default_due_days: form.default_due_days ? Number(form.default_due_days) : null,
        priority: form.priority,
        status: form.status,
        identification_color: form.identification_color || undefined,
        required: form.required,
        active: form.active,
      }
      if (editingStage) {
        await updateStage(editingStage.id, data)
        toast.success('Etapa Atualizada')
      } else {
        await createStage({ process: processId, ...data } as Parameters<typeof createStage>[0])
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

  const set = <K extends keyof StageFormState>(key: K, value: StageFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingStage ? 'Editar Etapa' : 'Nova Etapa'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Etapa *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Coleta de documentos"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descrição da etapa (opcional)"
              className="min-h-[60px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Ordem</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prazo Padrão (dias)</Label>
              <Input
                type="number"
                value={form.default_due_days}
                onChange={(e) => set('default_due_days', e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Departamento</Label>
              <Select value={form.department} onValueChange={(v) => set('department', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Responsável Padrão</Label>
              <Select
                value={form.default_responsible}
                onValueChange={(v) => set('default_responsible', v)}
              >
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
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
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor de Identificação</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set('identification_color', color)}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-all',
                    form.identification_color === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={form.identification_color || '#6366f1'}
                onChange={(e) => set('identification_color', e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-input"
              />
              {form.identification_color && (
                <button
                  type="button"
                  onClick={() => set('identification_color', '')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
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
              <Label className="text-sm font-medium">Etapa Ativa</Label>
              <Switch checked={form.active} onCheckedChange={(checked) => set('active', checked)} />
            </div>
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

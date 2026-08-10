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
import { ProcessModel, createModel, updateModel } from '@/services/process-models'
import type { Department } from '@/services/api'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface ModelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: Department[]
  editingModel?: ProcessModel | null
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  description: '',
  department: '',
  type: 'eventual',
  status: 'ativo',
}

export function ModelFormDialog({
  open,
  onOpenChange,
  departments,
  editingModel,
  onSuccess,
}: ModelFormDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState(emptyForm)
  const { user } = useAuth()

  useEffect(() => {
    if (editingModel) {
      setForm({
        name: editingModel.name || '',
        description: editingModel.description || '',
        department: editingModel.department || '',
        type: editingModel.type || 'eventual',
        status: editingModel.status || 'ativo',
      })
    } else {
      setForm(emptyForm)
    }
    setFieldErrors({})
  }, [editingModel, open])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      const data: Record<string, unknown> = { ...form }
      if (!data.department) delete data.department
      if (!data.description) delete data.description
      if (editingModel) {
        await updateModel(editingModel.id, data as any)
        toast.success('Modelo Atualizado Com Sucesso')
      } else {
        if (user?.id) data.created_by = user.id
        await createModel(data as any)
        toast.success('Modelo Criado Com Sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(editingModel ? 'Erro Ao Atualizar' : 'Erro Ao Criar Modelo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {editingModel ? 'Editar Modelo' : 'Novo Modelo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome do Modelo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Abertura de Empresa"
            />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descrição do modelo (opcional)"
              className="min-h-[70px] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eventual">Eventual</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
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
            {submitting ? 'Salvando...' : editingModel ? 'Salvar Alterações' : 'Criar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

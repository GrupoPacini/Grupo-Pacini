import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ClientResponsible,
  createClientResponsible,
  updateClientResponsible,
} from '@/services/client-responsibles'
import { getDepartments, type DepartmentRecord } from '@/services/departments'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  editingResponsible: ClientResponsible | null
  onSuccess: () => void
}

export function ResponsibleFormDialog({
  open,
  onOpenChange,
  clientId,
  editingResponsible,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({ user: '', department: '', role: '', observations: '' })
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        editingResponsible
          ? {
              user: editingResponsible.user || '',
              department: editingResponsible.department || '',
              role: editingResponsible.role || '',
              observations: editingResponsible.observations || '',
            }
          : { user: '', department: '', role: '', observations: '' },
      )
      setFieldErrors({})
      pb.collection('users')
        .getFullList({ sort: 'name' })
        .then((data) => {
          setUsers(data.map((u: any) => ({ id: u.id, name: u.name || u.email || '—' })))
        })
        .catch(() => {})
      getDepartments()
        .then(setDepartments)
        .catch(() => {})
    }
  }, [open, editingResponsible])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      const payload = {
        client: clientId,
        user: form.user || null,
        department: form.department || null,
        role: form.role,
        observations: form.observations,
      }
      if (editingResponsible) {
        await updateClientResponsible(editingResponsible.id, payload)
        toast.success('Responsável atualizado com sucesso')
      } else {
        await createClientResponsible(payload)
        toast.success('Responsável adicionado com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar responsável')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {editingResponsible ? 'Editar Responsável' : 'Novo Responsável'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Colaborador</Label>
            <Select
              value={form.user || '__none__'}
              onValueChange={(v) => setForm({ ...form, user: v === '__none__' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Departamento</Label>
            <Select
              value={form.department || '__none__'}
              onValueChange={(v) => setForm({ ...form, department: v === '__none__' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Função</Label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Contador responsável"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observações</Label>
            <Textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              placeholder="Observações sobre o responsável"
              rows={3}
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
            {submitting ? 'Salvando...' : editingResponsible ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

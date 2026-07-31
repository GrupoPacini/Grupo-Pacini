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
import { Checkbox } from '@/components/ui/checkbox'
import { Socio, createSocio, updateSocio } from '@/services/socios'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  editingSocio: Socio | null
  onSuccess: () => void
}

export function SocioFormDialog({ open, onOpenChange, clientId, editingSocio, onSuccess }: Props) {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    participacao_societaria: '',
    cargo: '',
    email: '',
    telefone: '',
    administrador: false,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        editingSocio
          ? {
              nome: editingSocio.nome || '',
              cpf: editingSocio.cpf || '',
              participacao_societaria: editingSocio.participacao_societaria?.toString() || '',
              cargo: editingSocio.cargo || '',
              email: editingSocio.email || '',
              telefone: editingSocio.telefone || '',
              administrador: editingSocio.administrador || false,
            }
          : {
              nome: '',
              cpf: '',
              participacao_societaria: '',
              cargo: '',
              email: '',
              telefone: '',
              administrador: false,
            },
      )
      setFieldErrors({})
    }
  }, [open, editingSocio])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      const payload = {
        client: clientId,
        nome: form.nome,
        cpf: form.cpf,
        participacao_societaria: form.participacao_societaria
          ? parseFloat(form.participacao_societaria)
          : undefined,
        cargo: form.cargo,
        email: form.email,
        telefone: form.telefone,
        administrador: form.administrador,
      }
      if (editingSocio) {
        await updateSocio(editingSocio.id, payload)
        toast.success('Sório atualizado com sucesso')
      } else {
        await createSocio(payload)
        toast.success('Sócio adicionado com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar sócio')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editingSocio ? 'Editar Sócio' : 'Novo Sócio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome *</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome completo"
            />
            {fieldErrors.nome && <p className="text-sm text-destructive">{fieldErrors.nome}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Participação (%)</Label>
              <Input
                type="number"
                value={form.participacao_societaria}
                onChange={(e) => setForm({ ...form, participacao_societaria: e.target.value })}
                placeholder="25"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cargo</Label>
              <Input
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Sócio Administrador"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="socio@email.com"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="socio-admin"
              checked={form.administrador}
              onCheckedChange={(v) => setForm({ ...form, administrador: v === true })}
            />
            <Label htmlFor="socio-admin" className="text-sm font-medium cursor-pointer">
              Administrador
            </Label>
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
            {submitting ? 'Salvando...' : editingSocio ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

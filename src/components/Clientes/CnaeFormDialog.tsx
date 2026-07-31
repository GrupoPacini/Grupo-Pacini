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
import {
  ClientCnae,
  createClientCnae,
  updateClientCnae,
  ensureSinglePrincipal,
} from '@/services/client-cnaes'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  editingCnae: ClientCnae | null
  onSuccess: () => void
}

export function CnaeFormDialog({ open, onOpenChange, clientId, editingCnae, onSuccess }: Props) {
  const [form, setForm] = useState({ code: '', description: '', is_principal: false })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        editingCnae
          ? {
              code: editingCnae.code || '',
              description: editingCnae.description || '',
              is_principal: editingCnae.is_principal || false,
            }
          : { code: '', description: '', is_principal: false },
      )
      setFieldErrors({})
    }
  }, [open, editingCnae])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      if (form.is_principal) {
        await ensureSinglePrincipal(clientId, editingCnae?.id)
      }
      const payload = {
        client: clientId,
        code: form.code,
        description: form.description,
        is_principal: form.is_principal,
      }
      if (editingCnae) {
        await updateClientCnae(editingCnae.id, payload)
        toast.success('CNAE atualizado com sucesso')
      } else {
        await createClientCnae(payload)
        toast.success('CNAE adicionado com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar CNAE')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{editingCnae ? 'Editar CNAE' : 'Novo CNAE'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Código *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="0000-0/00"
            />
            {fieldErrors.code && <p className="text-sm text-destructive">{fieldErrors.code}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Atividade econômica"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cnae-principal"
              checked={form.is_principal}
              onCheckedChange={(v) => setForm({ ...form, is_principal: v === true })}
            />
            <Label htmlFor="cnae-principal" className="text-sm font-medium cursor-pointer">
              CNAE Principal
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
            {submitting ? 'Salvando...' : editingCnae ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

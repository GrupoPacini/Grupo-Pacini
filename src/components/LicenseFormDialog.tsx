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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientCombobox } from '@/components/ClientCombobox'
import { Client } from '@/services/api'
import { License, createLicense, updateLicense } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { PRIORIDADES, STATUS_OPERACIONAL, LICENSE_STATUS } from '@/lib/license-utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FormState {
  name: string
  client: string
  status: string
  numero_protocolo: string
  expiration_date: string
  sem_vencimento: boolean
  prioridade: string
  pendencia_atual: string
  observacoes: string
  status_operacional: string
}

const emptyForm: FormState = {
  name: '',
  client: '',
  status: 'Ativo',
  numero_protocolo: '',
  expiration_date: '',
  sem_vencimento: false,
  prioridade: '',
  pendencia_atual: '',
  observacoes: '',
  status_operacional: 'Regular',
}

interface LicenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLicense: License | null
  clients: Client[]
  clientsLoading: boolean
  clientsError: boolean
  onSuccess: () => void
}

export function LicenseFormDialog({
  open,
  onOpenChange,
  editingLicense,
  clients,
  clientsLoading,
  clientsError,
  onSuccess,
}: LicenseFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (editingLicense) {
        setForm({
          name: editingLicense.name || '',
          client: editingLicense.client || '',
          status: editingLicense.status || 'Ativo',
          numero_protocolo: editingLicense.numero_protocolo || '',
          expiration_date: editingLicense.expiration_date || '',
          sem_vencimento: editingLicense.sem_vencimento || false,
          prioridade: editingLicense.prioridade || '',
          pendencia_atual: editingLicense.pendencia_atual || '',
          observacoes: editingLicense.observacoes || '',
          status_operacional: editingLicense.status_operacional || 'Regular',
        })
      } else {
        setForm(emptyForm)
      }
      setFieldErrors({})
    }
  }, [open, editingLicense])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    const errors: FieldErrors = {}
    if (!form.client) errors.client = 'Selecione um cliente.'
    if (!form.name.trim()) errors.name = 'Nome da licença é obrigatório.'
    if (!form.sem_vencimento && !form.expiration_date)
      errors.expiration_date = 'Data de vencimento é obrigatória quando não for indeterminada.'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setSubmitting(false)
      return
    }
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      client: form.client || undefined,
      status: form.status || undefined,
      numero_protocolo: form.numero_protocolo || undefined,
      expiration_date: form.sem_vencimento ? '' : form.expiration_date || undefined,
      sem_vencimento: form.sem_vencimento,
      prioridade: form.prioridade || undefined,
      pendencia_atual: form.pendencia_atual || undefined,
      observacoes: form.observacoes || undefined,
      status_operacional: form.status_operacional || undefined,
    }
    try {
      if (editingLicense) {
        await updateLicense(editingLicense.id, payload)
        toast.success('Licença Atualizada')
      } else {
        await createLicense(payload)
        toast.success('Licença Criada')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Salvar Licença')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-title-case">
            {editingLicense ? 'Editar Licença' : 'Nova Licença'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <ClientCombobox
              clients={clients}
              value={form.client}
              onChange={(v) => setForm({ ...form, client: v })}
              loading={clientsLoading}
              error={clientsError}
              invalid={!!fieldErrors.client}
            />
            {fieldErrors.client && <p className="text-sm text-destructive">{fieldErrors.client}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Licença</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Certificado Digital A1"
            />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Número do Protocolo</Label>
              <Input
                value={form.numero_protocolo}
                onChange={(e) => setForm({ ...form, numero_protocolo: e.target.value })}
                placeholder="Protocolo"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={form.status || '__none__'}
                onValueChange={(v) => setForm({ ...form, status: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {LICENSE_STATUS.map((s) => (
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
              <Label className="text-sm font-medium">Prioridade</Label>
              <Select
                value={form.prioridade || '__none__'}
                onValueChange={(v) => setForm({ ...form, prioridade: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status Operacional</Label>
              <Select
                value={form.status_operacional || '__none__'}
                onValueChange={(v) =>
                  setForm({ ...form, status_operacional: v === '__none__' ? '' : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {STATUS_OPERACIONAL.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Data de Vencimento</Label>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={form.expiration_date}
                onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                disabled={form.sem_vencimento}
                className={cn('flex-1', form.sem_vencimento && 'opacity-50')}
              />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Checkbox
                  id="sem_vencimento"
                  checked={form.sem_vencimento}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      sem_vencimento: checked === true,
                      expiration_date: checked === true ? '' : form.expiration_date,
                    })
                  }
                />
                <Label htmlFor="sem_vencimento" className="text-sm font-medium cursor-pointer">
                  Sem Vencimento
                </Label>
              </div>
            </div>
            {fieldErrors.expiration_date && (
              <p className="text-sm text-destructive">{fieldErrors.expiration_date}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pendência Atual</Label>
            <Input
              value={form.pendencia_atual}
              onChange={(e) => setForm({ ...form, pendencia_atual: e.target.value })}
              placeholder="Pendência atual"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Observações</Label>
            <Input
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Observações adicionais"
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
            {submitting ? 'Salvando...' : editingLicense ? 'Salvar Alterações' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

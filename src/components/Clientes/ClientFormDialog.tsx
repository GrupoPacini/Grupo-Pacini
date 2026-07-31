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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Client, createClient, updateClient } from '@/services/api'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']
const ONBOARDING_STATUSES = ['Lead', 'Documentação', 'Configuração', 'Ativo']

interface FormState {
  name: string
  cnpj: string
  tax_regime: string
  code: string
  alias: string
  onboarding_status: string
}

const emptyForm: FormState = {
  name: '',
  cnpj: '',
  tax_regime: '',
  code: '',
  alias: '',
  onboarding_status: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingClient: Client | null
  onSuccess: () => void
}

export function ClientFormDialog({ open, onOpenChange, editingClient, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (editingClient) {
        setForm({
          name: editingClient.name || '',
          cnpj: editingClient.cnpj || '',
          tax_regime: editingClient.tax_regime || '',
          code: editingClient.code || '',
          alias: editingClient.alias || '',
          onboarding_status: editingClient.onboarding_status || '',
        })
      } else {
        setForm(emptyForm)
      }
      setFieldErrors({})
    }
  }, [open, editingClient])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      const payload = { ...form, tax_regime: form.tax_regime || undefined }
      if (editingClient) {
        await updateClient(editingClient.id, payload)
        toast.success('Cliente Atualizado Com Sucesso')
      } else {
        await createClient(payload)
        toast.success('Cliente Criado Com Sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Salvar Cliente')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="client-name" className="text-sm font-medium">
              Nome Do Cliente
            </Label>
            <Input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Razão Social"
            />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-code" className="text-sm font-medium">
                Código
              </Label>
              <Input
                id="client-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="001"
                className="font-mono"
              />
              {fieldErrors.code && <p className="text-sm text-destructive">{fieldErrors.code}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-alias" className="text-sm font-medium">
                Apelido
              </Label>
              <Input
                id="client-alias"
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
                placeholder="Nome Fantasia"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-cnpj" className="text-sm font-medium">
              CNPJ
            </Label>
            <Input
              id="client-cnpj"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
            {fieldErrors.cnpj && <p className="text-sm text-destructive">{fieldErrors.cnpj}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Regime Tributário</Label>
            <Select
              value={form.tax_regime || '__none__'}
              onValueChange={(v) => setForm({ ...form, tax_regime: v === '__none__' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione (Opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                {TAX_REGIMES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status De Onboarding</Label>
            <Select
              value={form.onboarding_status || '__none__'}
              onValueChange={(v) =>
                setForm({ ...form, onboarding_status: v === '__none__' ? '' : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                {ONBOARDING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
            {submitting ? 'Salvando...' : editingClient ? 'Salvar Alterações' : 'Criar Cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

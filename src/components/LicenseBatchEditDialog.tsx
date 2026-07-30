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
import { License, updateLicense } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { LICENSE_STATUS } from '@/lib/license-utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface BatchFormState {
  name: string
  status: string
  expiration_date: string
  sem_vencimento: boolean
}

interface LicenseBatchEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLicenses: License[]
  onSuccess: () => void
}

export function LicenseBatchEditDialog({
  open,
  onOpenChange,
  selectedLicenses,
  onSuccess,
}: LicenseBatchEditDialogProps) {
  const [form, setForm] = useState<BatchFormState>({
    name: '',
    status: '',
    expiration_date: '',
    sem_vencimento: false,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ name: '', status: '', expiration_date: '', sem_vencimento: false })
      setFieldErrors({})
    }
  }, [open])

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})

    const payload: Record<string, unknown> = {}
    if (form.name.trim()) payload.name = form.name.trim()
    if (form.status) payload.status = form.status
    if (form.sem_vencimento) {
      payload.sem_vencimento = true
      payload.expiration_date = ''
    } else if (form.expiration_date) {
      payload.expiration_date = form.expiration_date
    }

    if (Object.keys(payload).length === 0) {
      setFieldErrors({ name: 'Preencha pelo menos um campo para atualizar.' })
      setSubmitting(false)
      return
    }

    let success = 0
    let failed = 0
    let lastError: unknown = null

    for (const license of selectedLicenses) {
      try {
        await updateLicense(license.id, payload)
        success++
      } catch (err) {
        lastError = err
        failed++
      }
    }

    if (success > 0) toast.success(`${success} licença(s) atualizada(s) com sucesso`)
    if (failed > 0) {
      toast.error(`Erro ao atualizar ${failed} licença(s)`)
      if (lastError) setFieldErrors(extractFieldErrors(lastError))
    }

    setSubmitting(false)
    if (failed === 0) {
      onOpenChange(false)
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-title-case">
            Editar {selectedLicenses.length} Licença(s)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Apenas os campos preenchidos serão atualizados nas licenças selecionadas.
          </p>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Licença</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Deixe vazio para manter o nome atual"
            />
            {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={form.status || '__none__'}
              onValueChange={(v) => setForm({ ...form, status: v === '__none__' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Deixe vazio para manter o status atual" />
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
            {fieldErrors.status && <p className="text-sm text-destructive">{fieldErrors.status}</p>}
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
                  id="batch_sem_vencimento"
                  checked={form.sem_vencimento}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      sem_vencimento: checked === true,
                      expiration_date: checked === true ? '' : form.expiration_date,
                    })
                  }
                />
                <Label
                  htmlFor="batch_sem_vencimento"
                  className="text-sm font-medium cursor-pointer"
                >
                  Sem Vencimento
                </Label>
              </div>
            </div>
            {fieldErrors.expiration_date && (
              <p className="text-sm text-destructive">{fieldErrors.expiration_date}</p>
            )}
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
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Aplicando...
              </span>
            ) : (
              'Aplicar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

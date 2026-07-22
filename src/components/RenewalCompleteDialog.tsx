import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { License, completeRenewal } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface RenewalCompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  license: License | null
  onSuccess: () => void
}

export function RenewalCompleteDialog({
  open,
  onOpenChange,
  license,
  onSuccess,
}: RenewalCompleteDialogProps) {
  const [expirationDate, setExpirationDate] = useState('')
  const [numeroProtocolo, setNumeroProtocolo] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && license) {
      setExpirationDate('')
      setNumeroProtocolo(license.numero_protocolo || '')
      setFieldErrors({})
    }
  }, [open, license])

  const handleSubmit = async () => {
    if (!license) return
    setSubmitting(true)
    setFieldErrors({})
    if (!expirationDate) {
      setFieldErrors({ expiration_date: 'Nova data de vencimento é obrigatória.' })
      setSubmitting(false)
      return
    }
    try {
      await completeRenewal(license.id, {
        expiration_date: expirationDate,
        numero_protocolo: numeroProtocolo || undefined,
      })
      toast.success('Renovação Concluída')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Concluir Renovação')
    } finally {
      setSubmitting(false)
    }
  }

  if (!license) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-title-case">Concluir Renovação</DialogTitle>
          <DialogDescription>
            Atualize os dados da licença «{license.name}» para concluir o processo de renovação. A
            licença retornará para a lista de licenças ativas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Nova Data de Vencimento <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
            {fieldErrors.expiration_date && (
              <p className="text-sm text-destructive">{fieldErrors.expiration_date}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número do Protocolo</Label>
            <Input
              value={numeroProtocolo}
              onChange={(e) => setNumeroProtocolo(e.target.value)}
              placeholder="Protocolo (opcional)"
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
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Concluindo...' : 'Concluir Renovação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

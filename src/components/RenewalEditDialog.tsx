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
import { License, updateLicense } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { ETAPAS_RENOVACAO, STATUS_OPERACIONAL, PRIORIDADES } from '@/lib/license-utils'
import { toast } from 'sonner'

interface RenewalFormState {
  status_operacional: string
  etapa_renovacao: string
  documentos_pendentes: string
  data_renovacao_inicio: string
  prioridade: string
  pendencia_atual: string
  observacoes: string
  numero_protocolo: string
}

interface RenewalEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  license: License | null
  onSuccess: () => void
}

export function RenewalEditDialog({
  open,
  onOpenChange,
  license,
  onSuccess,
}: RenewalEditDialogProps) {
  const [form, setForm] = useState<RenewalFormState>({
    status_operacional: '',
    etapa_renovacao: '',
    documentos_pendentes: '',
    data_renovacao_inicio: '',
    prioridade: '',
    pendencia_atual: '',
    observacoes: '',
    numero_protocolo: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && license) {
      setForm({
        status_operacional: license.status_operacional || '',
        etapa_renovacao: license.etapa_renovacao || '',
        documentos_pendentes: license.documentos_pendentes || '',
        data_renovacao_inicio: license.data_renovacao_inicio || '',
        prioridade: license.prioridade || '',
        pendencia_atual: license.pendencia_atual || '',
        observacoes: license.observacoes || '',
        numero_protocolo: license.numero_protocolo || '',
      })
      setFieldErrors({})
    }
  }, [open, license])

  const handleSubmit = async () => {
    if (!license) return
    setSubmitting(true)
    setFieldErrors({})
    try {
      await updateLicense(license.id, {
        status_operacional: form.status_operacional || undefined,
        etapa_renovacao: form.etapa_renovacao || undefined,
        documentos_pendentes: form.documentos_pendentes || undefined,
        data_renovacao_inicio: form.data_renovacao_inicio || undefined,
        prioridade: form.prioridade || undefined,
        pendencia_atual: form.pendencia_atual || undefined,
        observacoes: form.observacoes || undefined,
        numero_protocolo: form.numero_protocolo || undefined,
      })
      toast.success('Renovação Atualizada')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Atualizar Renovação')
    } finally {
      setSubmitting(false)
    }
  }

  if (!license) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-title-case">Editar Renovação — {license.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
              Dados de Renovação
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Etapa de Renovação</Label>
                <Select
                  value={form.etapa_renovacao || '__none__'}
                  onValueChange={(v) =>
                    setForm({ ...form, etapa_renovacao: v === '__none__' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {ETAPAS_RENOVACAO.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Início do Processo</Label>
                <Input
                  type="date"
                  value={form.data_renovacao_inicio}
                  onChange={(e) => setForm({ ...form, data_renovacao_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número do Protocolo</Label>
                <Input
                  value={form.numero_protocolo}
                  onChange={(e) => setForm({ ...form, numero_protocolo: e.target.value })}
                  placeholder="Protocolo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Documentos Pendentes</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                value={form.documentos_pendentes}
                onChange={(e) => setForm({ ...form, documentos_pendentes: e.target.value })}
                placeholder="Liste os documentos ou informações pendentes do cliente..."
              />
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
              <Label className="text-sm font-medium">Pendência Atual</Label>
              <Input
                value={form.pendencia_atual}
                onChange={(e) => setForm({ ...form, pendencia_atual: e.target.value })}
                placeholder="Pendência atual"
              />
            </div>
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
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

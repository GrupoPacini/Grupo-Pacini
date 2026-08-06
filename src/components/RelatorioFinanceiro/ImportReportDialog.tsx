import { useState, useEffect, useCallback } from 'react'
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
import { ClientCombobox } from '@/components/ClientCombobox'
import { AlertCircle, Loader2, Upload, AlertTriangle } from 'lucide-react'
import { MONTHS } from '@/lib/financial-utils'
import { checkDuplicateImport, importFinancialReport } from '@/services/financial-report-imports'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { ClientRecord } from '@/services/clients'

interface ImportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: ClientRecord[]
  prefill?: { client?: string; month?: string; year?: string } | null
  onImported: () => void
}

const VALID_EXTENSIONS = ['.xlsx', '.xls', '.csv']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i))

export function ImportReportDialog({
  open,
  onOpenChange,
  clients,
  prefill,
  onImported,
}: ImportReportDialogProps) {
  const [clientId, setClientId] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open) {
      setClientId(prefill?.client || '')
      setMonth(prefill?.month || '')
      setYear(prefill?.year || '')
      setFile(null)
      setFileData('')
      setNotes('')
      setFieldErrors({})
      setShowReplace(false)
      setErrorMsg('')
    }
  }, [open, prefill])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
    if (!VALID_EXTENSIONS.includes(ext)) {
      setFieldErrors((p) => ({ ...p, file: 'Formato inválido. Use .xlsx, .xls ou .csv.' }))
      setFile(null)
      setFileData('')
      return
    }
    if (f.size === 0) {
      setFieldErrors((p) => ({ ...p, file: 'O arquivo está vazio.' }))
      setFile(null)
      setFileData('')
      return
    }
    setFile(f)
    setFieldErrors((p) => ({ ...p, file: '' }))
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setFileData(result.split(',')[1])
    }
    reader.readAsDataURL(f)
  }, [])

  const validate = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!clientId) errors.client = 'Cliente é obrigatório.'
    if (!month) errors.month = 'Mês é obrigatório.'
    if (!year) errors.year = 'Ano é obrigatório.'
    if (!file) errors.file = 'Arquivo é obrigatório.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [clientId, month, year, file])

  const doImport = useCallback(
    async (replace: boolean) => {
      if (!file) return
      setSubmitting(true)
      setErrorMsg('')
      try {
        const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
        await importFinancialReport({
          client: clientId,
          month: parseInt(month, 10),
          year: parseInt(year, 10),
          notes: notes || undefined,
          replace,
          fileName: file.name,
          fileType: ext,
          fileData,
        })
        onImported()
        onOpenChange(false)
      } catch (err) {
        setErrorMsg(getErrorMessage(err))
      } finally {
        setSubmitting(false)
      }
    },
    [file, clientId, month, year, notes, fileData, onImported, onOpenChange],
  )

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const duplicate = await checkDuplicateImport(
        clientId,
        parseInt(month, 10),
        parseInt(year, 10),
      )
      setSubmitting(false)
      if (duplicate) {
        setShowReplace(true)
        return
      }
      await doImport(false)
    } catch (err) {
      setSubmitting(false)
      setErrorMsg(getErrorMessage(err))
    }
  }, [validate, clientId, month, year, doImport])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Relatório Mensal</DialogTitle>
        </DialogHeader>

        {showReplace ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-900/10">
              <AlertTriangle size={20} className="text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Já existe um relatório financeiro importado para este cliente neste mês. Deseja
                substituir o relatório atual?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReplace(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={() => doImport(true)} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Substituir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
              <ClientCombobox
                clients={clients}
                value={clientId}
                onChange={setClientId}
                invalid={!!fieldErrors.client}
              />
              {fieldErrors.client && (
                <p className="text-xs text-destructive">{fieldErrors.client}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Mês</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className={fieldErrors.month ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.month && (
                  <p className="text-xs text-destructive">{fieldErrors.month}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Ano</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className={fieldErrors.year ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.year && <p className="text-xs text-destructive">{fieldErrors.year}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Arquivo</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border border-dashed ${fieldErrors.file ? 'border-destructive' : 'border-input'} hover:bg-muted/50 transition-colors`}
                  >
                    <Upload size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {file ? file.name : 'Selecionar arquivo (.xlsx, .xls, .csv)'}
                    </span>
                  </div>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              {fieldErrors.file && <p className="text-xs text-destructive">{fieldErrors.file}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Observação (opcional)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <AlertCircle size={16} className="text-destructive shrink-0" />
                <span className="text-sm text-destructive">{errorMsg}</span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Importar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

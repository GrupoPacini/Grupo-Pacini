import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { importFinancialReport } from '@/services/financial-report-imports'

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

interface ImportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Array<{ id: string; name: string }>
  onImported: () => void
}

export function ImportReportDialog({
  open,
  onOpenChange,
  clients,
  onImported,
}: ImportReportDialogProps) {
  const [clientId, setClientId] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [fileData, setFileData] = useState('')
  const [fileName, setFileName] = useState('')
  const [notes, setNotes] = useState('')
  const [replace, setReplace] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setClientId('')
      setMonth('')
      setYear(String(new Date().getFullYear()))
      setFileData('')
      setFileName('')
      setNotes('')
      setReplace(false)
      setLoading(false)
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setFileData(event.target?.result as string)
      setFileName(file.name)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!clientId) {
      toast.error('Selecione um cliente.')
      return
    }
    if (!month) {
      toast.error('Selecione um mês.')
      return
    }
    if (!fileData) {
      toast.error('Selecione um arquivo CSV.')
      return
    }

    setLoading(true)
    try {
      const result = await importFinancialReport({
        client: clientId,
        month: Number(month),
        year: Number(year),
        fileData,
        fileName,
        fileType: '.csv',
        notes,
        replace,
      })
      toast.success(`${result.record_count} transações importadas com sucesso.`)
      onImported()
      onOpenChange(false)
    } catch (err: any) {
      const status = err?.status || err?.originalStatus
      const data = err?.response || {}
      if (status === 409) {
        toast.error('Já existe um relatório para este mês. Marque "Substituir" para sobrescrever.')
      } else if (status === 400) {
        toast.error(data.message || 'Erro ao processar o arquivo.')
      } else if (status === 403) {
        toast.error('Você não tem permissão para importar relatórios.')
      } else {
        toast.error(data.message || 'Erro ao importar relatório.')
      }
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Relatório Financeiro</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV para importar as transações.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ano</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Arquivo CSV</Label>
            <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-input p-4 hover:bg-accent transition-colors">
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              {fileName ? (
                <FileText className="h-4 w-4 text-primary" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground truncate">
                {fileName || 'Clique para selecionar um arquivo CSV'}
              </span>
            </label>
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a importação..."
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="replace"
              checked={replace}
              onCheckedChange={(v) => setReplace(v === true)}
            />
            <Label htmlFor="replace" className="text-sm font-normal cursor-pointer">
              Substituir relatório existente para este mês
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={loading || !fileData || !clientId || !month}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

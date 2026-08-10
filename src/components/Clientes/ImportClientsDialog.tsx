import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  SYSTEM_FIELDS,
  parseSpreadsheet,
  autoMapColumn,
  processRows,
  importClients,
  updateClients,
  downloadErrorCSV,
  type ProcessResult,
  type ImportResult,
} from '@/services/clients-bulk-import'
import { getAllClientsForImport, type ClientRecord } from '@/services/clients'
import { ImportComparisonView } from '@/components/Clientes/ImportComparisonView'

type Step = 'upload' | 'mapping' | 'preview' | 'comparison' | 'importing' | 'result'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportClientsDialog({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [existingClients, setExistingClients] = useState<ClientRecord[]>([])
  const [updateDecisions, setUpdateDecisions] = useState<Record<number, boolean>>({})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingUpdateCount, setPendingUpdateCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep('upload')
    setFile(null)
    setParsing(false)
    setHeaders([])
    setRawRows([])
    setMapping({})
    setLoadingPreview(false)
    setProcessResult(null)
    setImportProgress({ current: 0, total: 0 })
    setImportResult(null)
    setExistingClients([])
    setUpdateDecisions({})
    setShowConfirmDialog(false)
    setPendingUpdateCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleOpenChange = (open: boolean) => {
    if (!open && step === 'importing') return
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFileSelect = (selectedFile: File) => {
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast.error('Formato não suportado. Use .xlsx, .xls ou .csv.')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }
    setFile(selectedFile)
  }

  const handleParse = async () => {
    if (!file) return
    setParsing(true)
    try {
      const result = await parseSpreadsheet(file)
      setHeaders(result.headers)
      setRawRows(result.rows)
      const auto: Record<string, string> = {}
      for (const h of result.headers) {
        const mapped = autoMapColumn(h)
        if (mapped) auto[h] = mapped
      }
      setMapping(auto)
      setStep('mapping')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar arquivo.')
    } finally {
      setParsing(false)
    }
  }

  const handlePreview = async () => {
    setLoadingPreview(true)
    try {
      const existing = await getAllClientsForImport()
      setExistingClients(existing)
      const result = processRows(rawRows, mapping, existing)
      setProcessResult(result)
      setStep('preview')
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar dados.')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleProceedFromPreview = () => {
    if (processResult && processResult.existingCount > 0) {
      setStep('comparison')
    } else {
      handleExecuteImport()
    }
  }

  const handleComparisonConfirm = (decisions: Record<number, boolean>) => {
    setUpdateDecisions(decisions)
    const count =
      processResult?.rows.filter((r) => r.status === 'existing' && decisions[r.rowIndex]).length ??
      0
    if (count > 0) {
      setPendingUpdateCount(count)
      setShowConfirmDialog(true)
    } else {
      handleExecuteImport()
    }
  }

  const handleExecuteImport = async () => {
    if (!processResult) return
    setShowConfirmDialog(false)

    const newRows = processResult.rows.filter((r) => r.status === 'new')
    const existingRows = processResult.rows.filter((r) => r.status === 'existing')
    const rowsToUpdate = existingRows.filter((r) => updateDecisions[r.rowIndex] === true)
    const keptFromDecision = existingRows.length - rowsToUpdate.length

    setStep('importing')
    const totalOps = newRows.length + rowsToUpdate.length
    setImportProgress({ current: 0, total: totalOps })

    let imported = 0
    let updated = 0
    let noChange = 0
    let failed = 0
    const allErrors: ImportResult['errors'] = []

    try {
      if (newRows.length > 0) {
        const importRes = await importClients(newRows, (current) => {
          setImportProgress({ current, total: totalOps })
        })
        imported = importRes.imported
        failed += importRes.failed
        allErrors.push(...importRes.errors)
      }

      if (rowsToUpdate.length > 0) {
        const updateRes = await updateClients(rowsToUpdate, existingClients, (current) => {
          setImportProgress({ current: current + newRows.length, total: totalOps })
        })
        updated = updateRes.updated
        noChange = updateRes.kept
        failed += updateRes.failed
        allErrors.push(...updateRes.errors)
      }

      const result: ImportResult = {
        imported,
        updated,
        kept: keptFromDecision + noChange,
        failed,
        errors: allErrors,
      }

      setImportResult(result)
      setStep('result')
      if (imported > 0 || updated > 0) onSuccess()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao importar/atualizar clientes.')
      setStep('preview')
    }
  }

  const showComparisonStep = (processResult?.existingCount ?? 0) > 0
  const stepLabels = showComparisonStep
    ? ['Upload', 'Mapeamento', 'Pré-visualização', 'Comparação', 'Resultado']
    : ['Upload', 'Mapeamento', 'Pré-visualização', 'Resultado']
  const allSteps = showComparisonStep
    ? ['upload', 'mapping', 'preview', 'comparison', 'importing', 'result']
    : ['upload', 'mapping', 'preview', 'importing', 'result']
  const stepIdx = allSteps.indexOf(step)
  const displayStep = Math.min(stepIdx, stepLabels.length - 1)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Importe múltiplos clientes a partir de uma planilha (.xlsx, .xls, .csv).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 ${
                  i <= displayStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                    i < displayStep
                      ? 'bg-primary text-primary-foreground border-primary'
                      : i === displayStep
                        ? 'border-primary'
                        : 'border-muted'
                  }`}
                >
                  {i < displayStep ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-input p-8 hover:bg-accent transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              {file ? (
                <>
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo (.xlsx, .xls, .csv)
                  </span>
                </>
              )}
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleParse} disabled={!file || parsing}>
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Associe cada coluna da planilha a um campo do sistema. Colunas não mapeadas serão
              ignoradas.
            </p>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{header}</span>
                  </div>
                  <span className="text-muted-foreground text-sm shrink-0">→</span>
                  <Select
                    value={mapping[header] || '__none__'}
                    onValueChange={(v) =>
                      setMapping((prev) => ({ ...prev, [header]: v === '__none__' ? '' : v }))
                    }
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Não importar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Não importar —</SelectItem>
                      {SYSTEM_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button onClick={handlePreview} disabled={loadingPreview}>
                {loadingPreview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && processResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Total de linhas</p>
                <p className="text-xl font-bold">{processResult.total}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-green-600">Novos clientes</p>
                <p className="text-xl font-bold text-green-600">{processResult.newCount}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-blue-600">Já cadastrados</p>
                <p className="text-xl font-bold text-blue-600">{processResult.existingCount}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-red-600">Com erro</p>
                <p className="text-xl font-bold text-red-600">{processResult.errorCount}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-amber-600">CNPJs inválidos</p>
                <p className="text-xl font-bold text-amber-600">{processResult.invalidCnpjCount}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-orange-600">Códigos duplicados</p>
                <p className="text-xl font-bold text-orange-600">
                  {processResult.duplicateCodeCount}
                </p>
              </Card>
            </div>
            {processResult.existingCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <RefreshCw className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {processResult.existingCount} cliente(s) já cadastrado(s) serão revisados para
                  possível atualização no próximo passo.
                </p>
              </div>
            )}
            <div className="max-h-[300px] overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Linha</th>
                    <th className="text-left p-2 font-medium">Razão Social</th>
                    <th className="text-left p-2 font-medium">CNPJ</th>
                    <th className="text-left p-2 font-medium">Código</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {processResult.rows.slice(0, 50).map((row) => (
                    <tr key={row.rowIndex} className="border-t">
                      <td className="p-2 text-muted-foreground">{row.rowIndex + 1}</td>
                      <td className="p-2">{row.mapped.razao_social || '—'}</td>
                      <td className="p-2 font-mono text-xs">{row.mapped.cnpj || '—'}</td>
                      <td className="p-2 font-mono text-xs">{row.mapped.code || '—'}</td>
                      <td className="p-2">
                        {row.status === 'new' && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Novo
                          </Badge>
                        )}
                        {row.status === 'existing' && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Existente
                          </Badge>
                        )}
                        {row.status === 'error' && (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200"
                          >
                            Erro
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{row.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {processResult.total > 50 && (
              <p className="text-xs text-muted-foreground text-center">
                Mostrando primeiras 50 linhas de {processResult.total}
              </p>
            )}
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <Button
                onClick={handleProceedFromPreview}
                disabled={processResult.newCount === 0 && processResult.existingCount === 0}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {processResult.existingCount > 0
                  ? 'Continuar'
                  : `Importar ${processResult.newCount} cliente(s)`}
              </Button>
            </div>
          </div>
        )}

        {step === 'comparison' && processResult && (
          <ImportComparisonView
            rows={processResult.rows}
            newCount={processResult.newCount}
            onBack={() => setStep('preview')}
            onConfirm={handleComparisonConfirm}
          />
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-sm font-medium">Processando clientes...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {importProgress.current} de {importProgress.total}
              </p>
            </div>
            <Progress
              value={
                importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0
              }
            />
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Novos importados</span>
                </div>
                <p className="text-xl font-bold text-green-600">{importResult.imported}</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Atualizados</span>
                </div>
                <p className="text-xl font-bold text-blue-600">{importResult.updated}</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-muted-foreground">Mantidos</span>
                </div>
                <p className="text-xl font-bold text-gray-500">{importResult.kept}</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-muted-foreground">Com erro</span>
                </div>
                <p className="text-xl font-bold text-red-600">{importResult.failed}</p>
              </Card>
            </div>
            {importResult.errors.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Erros</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadErrorCSV(importResult.errors)}
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" /> Baixar erros
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">Linha</th>
                        <th className="text-left p-2 font-medium">Cliente</th>
                        <th className="text-left p-2 font-medium">Erro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 text-muted-foreground">{err.rowIndex}</td>
                          <td className="p-2">{err.razao_social || err.cnpj || '—'}</td>
                          <td className="p-2 text-xs text-red-600">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="flex justify-end">
              <Button onClick={() => handleOpenChange(false)}>Concluir</Button>
            </div>
          </div>
        )}
      </DialogContent>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar atualização</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a atualizar {pendingUpdateCount}{' '}
              {pendingUpdateCount === 1 ? 'cliente existente' : 'clientes existentes'}. As
              alterações serão gravadas no banco de dados. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecuteImport}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

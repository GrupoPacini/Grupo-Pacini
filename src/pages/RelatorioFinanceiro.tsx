import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileDown,
  FileSpreadsheet,
  Building2,
  CalendarRange,
  RefreshCw,
  Upload,
  Inbox,
  Search,
  Landmark,
} from 'lucide-react'
import { MainIndicatorCard } from '@/components/RelatorioFinanceiro/MainIndicatorCard'
import { CategoryDonutCard } from '@/components/RelatorioFinanceiro/CategoryDonutCard'
import { TransactionsTable } from '@/components/RelatorioFinanceiro/TransactionsTable'
import { FinancialAnalysisCard } from '@/components/RelatorioFinanceiro/FinancialAnalysisCard'
import { FinancialAlertsCard } from '@/components/RelatorioFinanceiro/FinancialAlertsCard'
import { ImportReportDialog } from '@/components/RelatorioFinanceiro/ImportReportDialog'
import { EditOpeningBalanceDialog } from '@/components/RelatorioFinanceiro/EditOpeningBalanceDialog'
import { MonthMultiSelect } from '@/components/RelatorioFinanceiro/MonthMultiSelect'
import { ImportedReportsTable } from '@/components/RelatorioFinanceiro/ImportedReportsTable'
import { DeleteReportDialog } from '@/components/RelatorioFinanceiro/DeleteReportDialog'
import { ClientCombobox } from '@/components/ClientCombobox'
import { useFinancialData, EMPTY_FILTERS, type FinancialFilters } from '@/hooks/use-financial-data'
import { usePermissions } from '@/hooks/use-permissions'
import { type DataState, MONTHS } from '@/lib/financial-utils'
import type { FinancialReportImport } from '@/services/financial-report-imports'
import { deleteImportReport } from '@/services/financial-report-imports'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from '@/hooks/use-toast'
import {
  groupByMonth,
  groupByCategory,
  computeSaldoEvolution,
  computeAlerts,
  generateAnalysis,
  computeSaldoFinal,
} from '@/lib/financial-computations'
import { exportToPDF, exportToExcel } from '@/lib/financial-export'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i))

export default function RelatorioFinanceiro() {
  const [filters, setFilters] = useState<FinancialFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<FinancialFilters>(EMPTY_FILTERS)
  const [importOpen, setImportOpen] = useState(false)
  const [importPrefill, setImportPrefill] = useState<{
    client?: string
    month?: string
    year?: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FinancialReportImport | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editOpeningBalanceTarget, setEditOpeningBalanceTarget] =
    useState<FinancialReportImport | null>(null)
  const { can } = usePermissions()

  const { loading, error, transactions, allTransactions, clients, imports, retry, refreshImports } =
    useFinancialData(appliedFilters)

  const isClientSelected = appliedFilters.cliente !== 'all' && Boolean(appliedFilters.cliente)

  const dataState: DataState = !isClientSelected
    ? 'empty'
    : loading
      ? 'loading'
      : error
        ? 'error'
        : transactions.length > 0
          ? 'ready'
          : 'empty'

  const filterOptions = useMemo(
    () => ({
      categories: [
        'Todas',
        ...Array.from(new Set(allTransactions.map((t) => t.category).filter(Boolean))),
      ].sort(),
      accounts: [
        'Todas',
        ...Array.from(new Set(allTransactions.map((t) => t.account).filter(Boolean))),
      ].sort(),
      projects: [
        'Todos',
        ...Array.from(new Set(allTransactions.map((t) => t.project).filter(Boolean))),
      ].sort(),
    }),
    [allTransactions],
  )

  const selectFields = [
    { label: 'Categoria', key: 'categoria' as const, options: filterOptions.categories },
    { label: 'Conta', key: 'conta' as const, options: filterOptions.accounts },
    { label: 'Projeto', key: 'projeto' as const, options: filterOptions.projects },
  ]

  const { receitasTotal, despesasTotal, resultado } = useMemo(() => {
    const r = transactions.filter((t) => t.type === 'Receita').reduce((s, t) => s + t.value, 0)
    const d = transactions.filter((t) => t.type === 'Despesa').reduce((s, t) => s + t.value, 0)
    return { receitasTotal: r, despesasTotal: d, resultado: r - d }
  }, [transactions])

  const receitasData = useMemo(
    () => groupByMonth(transactions.filter((t) => t.type === 'Receita')),
    [transactions],
  )
  const despesasData = useMemo(
    () => groupByMonth(transactions.filter((t) => t.type === 'Despesa')),
    [transactions],
  )
  const saldoData = useMemo(() => computeSaldoEvolution(transactions), [transactions])
  const openingBalance = useMemo(() => {
    if (!isClientSelected) return null
    const isAllMonths = appliedFilters.mes.includes('all') || appliedFilters.mes.length === 0
    const selectedMonths = appliedFilters.mes.filter((m) => m !== 'all')
    if (isAllMonths && appliedFilters.ano === 'all') {
      const sorted = [...imports].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })
      const first = sorted[0]
      return first?.opening_balance != null ? first.opening_balance : null
    }
    if (isAllMonths) {
      const year = Number(appliedFilters.ano)
      const yearImports = imports.filter((i) => i.year === year)
      const sorted = [...yearImports].sort((a, b) => a.month - b.month)
      const first = sorted[0]
      return first?.opening_balance != null ? first.opening_balance : null
    }
    if (appliedFilters.ano === 'all') return null
    const year = Number(appliedFilters.ano)
    const sortedMonths = selectedMonths.map(Number).sort((a, b) => a - b)
    const firstMonth = sortedMonths[0]
    const importRecord = imports.find((i) => i.month === firstMonth && i.year === year)
    return importRecord?.opening_balance != null ? importRecord.opening_balance : null
  }, [imports, appliedFilters, isClientSelected])

  const saldoFinal = useMemo(
    () => computeSaldoFinal(transactions, receitasTotal, despesasTotal, openingBalance),
    [transactions, receitasTotal, despesasTotal, openingBalance],
  )
  const saldoFinalUnavailable = saldoFinal === null
  const saldoFinalResultColor =
    saldoFinal !== null
      ? saldoFinal > 0
        ? 'text-green-600'
        : saldoFinal < 0
          ? 'text-red-600'
          : 'text-foreground'
      : undefined
  const entradasCategoria = useMemo(
    () => groupByCategory(transactions.filter((t) => t.type === 'Receita')),
    [transactions],
  )
  const saidasCategoria = useMemo(
    () => groupByCategory(transactions.filter((t) => t.type === 'Despesa')),
    [transactions],
  )

  const hasCompetence =
    isClientSelected &&
    !appliedFilters.mes.includes('all') &&
    appliedFilters.mes.length > 0 &&
    appliedFilters.ano !== 'all'
  const analysis =
    hasCompetence && dataState === 'ready' && transactions.length > 0
      ? generateAnalysis(receitasTotal, despesasTotal, resultado, transactions.length)
      : null
  const analysisState: DataState = !isClientSelected ? 'empty' : dataState
  const alerts =
    dataState === 'ready' ? computeAlerts(transactions, receitasTotal, despesasTotal) : null

  const selectedClient = clients.find((c) => c.id === appliedFilters.cliente)
  const clienteLabel = selectedClient
    ? selectedClient.razao_social || selectedClient.name
    : 'Nenhum cliente selecionado'
  const periodLabel = (() => {
    if (appliedFilters.ano === 'all') return 'Todos os períodos'
    const isAllMonths = appliedFilters.mes.includes('all') || appliedFilters.mes.length === 0
    const selectedMonths = appliedFilters.mes.filter((m) => m !== 'all')
    if (isAllMonths) return `Ano ${appliedFilters.ano}`
    if (selectedMonths.length === 1) {
      return `${MONTHS.find((m) => m.value === selectedMonths[0])?.label || ''}/${appliedFilters.ano}`
    }
    if (selectedMonths.length === 2) {
      const labels = selectedMonths.map((v) => MONTHS.find((m) => m.value === v)?.label || '')
      return `${labels.join(', ')}/${appliedFilters.ano}`
    }
    return `${selectedMonths.length} meses/${appliedFilters.ano}`
  })()

  const handleApply = () => setAppliedFilters({ ...filters })
  const handleClear = () => {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  const handleOpenImport = () => {
    setImportPrefill(isClientSelected ? { client: appliedFilters.cliente } : null)
    setImportOpen(true)
  }
  const handleReimport = (clientId: string, month: number, year: number) => {
    const existingImport = imports.find(
      (i) => i.client === clientId && i.month === month && i.year === year,
    )
    setImportPrefill({
      client: clientId,
      month: String(month),
      year: String(year),
      openingBalance: existingImport?.opening_balance,
    })
    setImportOpen(true)
  }
  const handleImported = () => {
    refreshImports()
    retry()
    toast({ title: 'Importação concluída', description: 'O relatório foi importado com sucesso.' })
  }

  const handleOpeningBalanceUpdated = () => {
    refreshImports()
    retry()
    toast({
      title: 'Saldo inicial atualizado',
      description: 'O saldo inicial foi atualizado com sucesso.',
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteImportReport(deleteTarget.id)
      setDeleteTarget(null)
      refreshImports()
      retry()
      toast({ title: 'Relatório excluído', description: 'Os lançamentos foram removidos.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleView = (clientId: string, month: number, year: number) => {
    const newFilters = {
      ...EMPTY_FILTERS,
      cliente: clientId,
      mes: [String(month)],
      ano: String(year),
    }
    setFilters(newFilters)
    setAppliedFilters(newFilters)
  }

  const canExport = isClientSelected && dataState === 'ready' && transactions.length > 0
  const handleExportPDF = () => {
    if (canExport)
      exportToPDF(
        transactions,
        { receitas: receitasTotal, despesas: despesasTotal, resultado },
        clienteLabel,
        periodLabel,
      )
  }
  const handleExportExcel = () => {
    if (canExport) exportToExcel(transactions, clienteLabel, periodLabel)
  }

  const canDeleteImport = can('Relatório Financeiro', 'excluir')
  const canEditImport = can('Relatório Financeiro', 'editar')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe os principais indicadores financeiros do cliente.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Building2 size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium text-foreground">{clienteLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarRange size={16} className="text-muted-foreground" />
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium text-foreground">{periodLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2" onClick={handleOpenImport}>
              <Upload size={16} />
              Importar relatório mensal
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!canExport}
              onClick={handleExportPDF}
            >
              <FileDown size={16} />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!canExport}
              onClick={handleExportExcel}
            >
              <FileSpreadsheet size={16} />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 shadow-sm border-t-4 border-t-accent">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
            <ClientCombobox
              clients={clients}
              value={filters.cliente === 'all' ? '' : filters.cliente}
              onChange={(val) => setFilters((f) => ({ ...f, cliente: val || 'all' }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Mês</Label>
            <MonthMultiSelect
              value={filters.mes}
              onChange={(val) => setFilters((f) => ({ ...f, mes: val }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Ano</Label>
            <Select
              value={filters.ano}
              onValueChange={(v) => setFilters((f) => ({ ...f, ano: v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectFields.map((sf) => (
            <div className="space-y-1.5" key={sf.key}>
              <Label className="text-xs font-medium text-muted-foreground">{sf.label}</Label>
              <Select
                value={filters[sf.key]}
                onValueChange={(v) => setFilters((f) => ({ ...f, [sf.key]: v }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sf.options.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleClear}>
            Limpar filtros
          </Button>
          <Button size="sm" onClick={handleApply}>
            Aplicar filtros
          </Button>
        </div>
      </Card>

      {error && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <span className="text-sm text-destructive">Erro ao carregar dados financeiros.</span>
          <Button variant="outline" size="sm" onClick={retry} className="gap-2">
            <RefreshCw size={14} /> Tentar novamente
          </Button>
        </div>
      )}

      {!isClientSelected && (
        <Card className="p-8 border-t-4 border-t-primary shadow-sm text-center">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Building2 size={36} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Selecione um cliente</h3>
            <p className="text-sm text-muted-foreground">
              Selecione um cliente para visualizar as informações financeiras.
            </p>
          </div>
        </Card>
      )}

      {isClientSelected && dataState === 'empty' && (
        <Card className="p-8 border-t-4 border-t-accent shadow-sm">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="rounded-full bg-muted p-4 mb-3">
              <Inbox size={32} className="text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground max-w-md mb-4 font-medium">
              Nenhum relatório financeiro importado para este cliente no período selecionado.
            </p>
            <Button className="gap-2" onClick={handleOpenImport}>
              <Upload size={16} /> Importar relatório mensal
            </Button>
          </div>
        </Card>
      )}

      {isClientSelected && dataState !== 'empty' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <MainIndicatorCard
              title="Receitas"
              icon={TrendingUp}
              iconColor="text-green-600"
              bg="bg-green-100 dark:bg-green-900/20"
              data={receitasData}
              state={dataState}
              total={receitasTotal}
              chartColor="hsl(var(--chart-1))"
              gradientId="grad-receitas"
            />
            <MainIndicatorCard
              title="Despesas"
              icon={TrendingDown}
              iconColor="text-red-600"
              bg="bg-red-100 dark:bg-red-900/20"
              data={despesasData}
              state={dataState}
              total={despesasTotal}
              chartColor="hsl(var(--chart-4))"
              gradientId="grad-despesas"
            />
            <MainIndicatorCard
              title="Resultado"
              icon={Wallet}
              iconColor="text-blue-600"
              bg="bg-blue-100 dark:bg-blue-900/20"
              data={saldoData}
              state={dataState}
              total={resultado}
              chartColor="hsl(var(--chart-2))"
              gradientId="grad-resultado"
              resultColor={resultado >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <MainIndicatorCard
              title="Saldo Final"
              icon={Landmark}
              iconColor="text-purple-600"
              bg="bg-purple-100 dark:bg-purple-900/20"
              data={saldoFinalUnavailable ? null : saldoData}
              state={dataState}
              total={saldoFinal}
              chartColor="hsl(var(--chart-3))"
              gradientId="grad-saldo-final"
              resultColor={saldoFinalResultColor}
              unavailable={saldoFinalUnavailable}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryDonutCard
              title="Entradas por Categoria"
              data={entradasCategoria}
              state={dataState}
            />
            <CategoryDonutCard
              title="Saídas por Categoria"
              data={saidasCategoria}
              state={dataState}
            />
          </div>

          <TransactionsTable data={transactions} state={dataState} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FinancialAnalysisCard state={analysisState} analysis={analysis} />
            <FinancialAlertsCard state={dataState} alerts={alerts} />
          </div>
        </>
      )}

      {isClientSelected && (
        <ImportedReportsTable
          imports={imports}
          clients={clients}
          loading={loading}
          canDelete={canDeleteImport}
          canEdit={canEditImport}
          onView={handleView}
          onReimport={handleReimport}
          onEditOpeningBalance={setEditOpeningBalanceTarget}
          onDelete={setDeleteTarget}
        />
      )}

      <ImportReportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        clients={clients}
        prefill={importPrefill}
        onImported={handleImported}
      />

      <DeleteReportDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        importRecord={deleteTarget}
        clients={clients}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />

      <EditOpeningBalanceDialog
        open={!!editOpeningBalanceTarget}
        onOpenChange={(v) => !v && setEditOpeningBalanceTarget(null)}
        importRecord={editOpeningBalanceTarget}
        clients={clients}
        onUpdated={handleOpeningBalanceUpdated}
      />
    </div>
  )
}

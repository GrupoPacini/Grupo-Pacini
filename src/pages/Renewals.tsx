import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Pencil,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { License, getLicenses } from '@/services/licenses'
import { RenewalEditDialog } from '@/components/RenewalEditDialog'
import { RenewalCompleteDialog } from '@/components/RenewalCompleteDialog'
import { FilterBar } from '@/components/FilterBar'
import { DueDateCell } from '@/components/DueDateCell'
import {
  etapaRenovacaoBadge,
  prioridadeBadge,
  PRIORIDADES,
  ETAPAS_RENOVACAO,
} from '@/lib/license-utils'
import { type FilterCondition, type FilterFieldConfig, isConditionEmpty } from '@/lib/filter-types'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const FILTER_FIELDS: FilterFieldConfig[] = [
  {
    field: 'cliente',
    label: 'Cliente',
    type: 'text',
    operators: [
      { value: 'contains', label: 'contém' },
      { value: 'eq', label: 'é igual a' },
    ],
  },
  {
    field: 'status',
    label: 'Status',
    type: 'multiselect',
    operators: [],
    options: [
      { value: 'Renovando', label: 'Renovando' },
      { value: 'Vencido', label: 'Vencido' },
      { value: 'Pendente', label: 'Pendente' },
    ],
  },
  {
    field: 'prioridade',
    label: 'Prioridade',
    type: 'multiselect',
    operators: [],
    options: PRIORIDADES.map((p) => ({ value: p, label: p })),
  },
  {
    field: 'etapa',
    label: 'Etapa de Renovação',
    type: 'multiselect',
    operators: [],
    options: ETAPAS_RENOVACAO.map((e) => ({ value: e, label: e })),
  },
  {
    field: 'data_inicio',
    label: 'Data de Início da Renovação',
    type: 'chips-date-range',
    operators: [],
    chips: [
      { value: 'este_mes', label: 'Este mês' },
      { value: 'ultimos_30', label: 'Últimos 30 dias' },
      { value: 'este_ano', label: 'Este ano' },
    ],
  },
]

function applyConditions(data: License[], conditions: FilterCondition[]): License[] {
  return conditions.reduce((acc, c) => {
    if (isConditionEmpty(c)) return acc
    if (c.field === 'cliente') {
      const q = (c.value as string).toLowerCase()
      return acc.filter((l) => {
        const name = (l.expand?.client?.name || '').toLowerCase()
        const cnpj = l.expand?.client?.cnpj || ''
        return c.operator === 'eq' ? name === q || cnpj === q : name.includes(q) || cnpj.includes(q)
      })
    }
    if (c.field === 'status') {
      const vals = c.value as string[]
      return acc.filter((l) => vals.includes(l.status))
    }
    if (c.field === 'prioridade')
      return acc.filter((l) => (c.value as string[]).includes(l.prioridade))
    if (c.field === 'etapa')
      return acc.filter((l) => (c.value as string[]).includes(l.etapa_renovacao))
    if (c.field === 'data_inicio') {
      if (typeof c.value === 'string') {
        const now = new Date()
        if (c.value === 'este_mes') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
          return acc.filter(
            (l) =>
              l.data_renovacao_inicio &&
              l.data_renovacao_inicio >= start &&
              l.data_renovacao_inicio <= end,
          )
        }
        if (c.value === 'ultimos_30') {
          const start = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
          return acc.filter((l) => l.data_renovacao_inicio && l.data_renovacao_inicio >= start)
        }
        if (c.value === 'este_ano') {
          const start = `${now.getFullYear()}-01-01`
          return acc.filter((l) => l.data_renovacao_inicio && l.data_renovacao_inicio >= start)
        }
      } else if (c.value && typeof c.value === 'object') {
        const { start, end } = c.value as { start: string; end: string }
        return acc.filter(
          (l) =>
            l.data_renovacao_inicio &&
            (!start || l.data_renovacao_inicio >= start) &&
            (!end || l.data_renovacao_inicio <= end),
        )
      }
    }
    return acc
  }, data)
}

export default function Renewals() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([
    { id: 'default-status', field: 'status', operator: '', value: ['Renovando'] },
  ])
  const [editOpen, setEditOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadData = useCallback(async () => {
    try {
      setLicenses(await getLicenses())
    } catch {
      toast.error('Erro Ao Carregar Renovações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('licenses', () => loadData())

  const renewalLicenses = useMemo(
    () =>
      licenses.filter(
        (l) => l.status === 'Renovando' || l.status === 'Vencido' || l.status === 'Pendente',
      ),
    [licenses],
  )

  const filtered = useMemo(() => {
    let result = renewalLicenses
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((l) => {
        const name = (l.expand?.client?.name || '').toLowerCase()
        const cnpj = l.expand?.client?.cnpj || ''
        const licName = (l.name || '').toLowerCase()
        return name.includes(q) || cnpj.includes(q) || licName.includes(q)
      })
    }
    return applyConditions(result, filterConditions)
  }, [renewalLicenses, search, filterConditions])

  const counts = useMemo(
    () => ({
      vencidas: renewalLicenses.filter((l) => l.status === 'Vencido').length,
      emRenovacao: renewalLicenses.filter((l) => l.status === 'Renovando').length,
      pendentes: renewalLicenses.filter((l) => l.status === 'Pendente').length,
      total: renewalLicenses.length,
    }),
    [renewalLicenses],
  )

  const allChecked = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))
  const someChecked = filtered.some((l) => selectedIds.has(l.id)) && !allChecked

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((l) => next.delete(l.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((l) => next.add(l.id))
        return next
      })
    }
  }

  const openEdit = (license: License) => {
    setSelectedLicense(license)
    setEditOpen(true)
  }
  const openComplete = (license: License) => {
    setSelectedLicense(license)
    setCompleteOpen(true)
  }

  const summaryCards = [
    {
      label: 'Vencidas',
      value: counts.vencidas,
      icon: XCircle,
      iconColor: 'text-destructive',
      bg: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      label: 'Em Renovação',
      value: counts.emRenovacao,
      icon: RefreshCw,
      iconColor: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Pendentes',
      value: counts.pendentes,
      icon: Clock,
      iconColor: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      label: 'Total em Renovação',
      value: counts.total,
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw size={18} className="text-blue-600" />
          <span className="text-sm">Gestão de renovações e licenças vencidas</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-4 shadow-sm border-t-4 border-t-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={cn('rounded-full p-3', card.bg)}>
                  <Icon size={20} className={card.iconColor} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 shadow-sm border-t-4 border-t-accent">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          fields={FILTER_FIELDS}
          conditions={filterConditions}
          onConditionsChange={setFilterConditions}
          searchPlaceholder="Buscar por cliente, CNPJ ou licença..."
        />
      </Card>

      <Card className="border-t-4 border-t-accent overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-title-case">Controle de Renovações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhuma renovação pendente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 pl-4">
                      <Checkbox
                        checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                        onCheckedChange={toggleAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Licença</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Vencimento
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Prioridade
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Etapa</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Início</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Obs.</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground pr-4">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const hasPendingDocs = !!l.documentos_pendentes?.trim()
                    const isConcluida = l.etapa_renovacao === 'Concluída'
                    return (
                      <TableRow key={l.id} className="transition-colors">
                        <TableCell className="pl-4 py-4">
                          <Checkbox
                            checked={selectedIds.has(l.id)}
                            onCheckedChange={() => toggleSelection(l.id)}
                            aria-label={`Selecionar ${l.name}`}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {l.expand?.client?.razao_social || l.expand?.client?.name || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {l.expand?.client?.cnpj || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{l.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <DueDateCell
                            expiration_date={l.expiration_date}
                            sem_vencimento={l.sem_vencimento}
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          {l.prioridade ? (
                            <Badge
                              variant="outline"
                              className={cn('rounded-full', prioridadeBadge(l.prioridade))}
                            >
                              {l.prioridade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {l.etapa_renovacao ? (
                            <Badge
                              variant="outline"
                              className={cn('rounded-full', etapaRenovacaoBadge(l.etapa_renovacao))}
                            >
                              {l.etapa_renovacao}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {l.data_renovacao_inicio ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-muted-foreground shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(l.data_renovacao_inicio), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {hasPendingDocs ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center">
                                    <FileWarning
                                      size={18}
                                      className="text-orange-600 dark:text-orange-400 cursor-help"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs font-semibold mb-1">Observações:</p>
                                  <p className="text-xs whitespace-pre-wrap">
                                    {l.documentos_pendentes}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEdit(l)}
                            >
                              <Pencil size={16} />
                            </Button>
                            {!isConcluida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                onClick={() => openComplete(l)}
                              >
                                <CheckCircle2 size={16} />
                                <span className="hidden sm:inline">Concluir</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RenewalEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        license={selectedLicense}
        onSuccess={loadData}
      />
      <RenewalCompleteDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        license={selectedLicense}
        onSuccess={loadData}
      />
    </div>
  )
}

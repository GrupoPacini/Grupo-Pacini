import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  AlertCircle,
  PlayCircle,
  Trash2,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Client, getClients } from '@/services/api'
import { License, getLicenses, startRenewal, deleteLicense } from '@/services/licenses'
import { LicenseFormDialog } from '@/components/LicenseFormDialog'
import { FilterBar } from '@/components/FilterBar'
import { DueDateCell } from '@/components/DueDateCell'
import { getDaysRemaining, licenseStatusBadge, LICENSE_STATUS } from '@/lib/license-utils'
import { type FilterCondition, type FilterFieldConfig, isConditionEmpty } from '@/lib/filter-types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

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
    label: 'Status da Licença',
    type: 'multiselect',
    operators: [],
    options: LICENSE_STATUS.map((s) => ({ value: s, label: s })),
  },
  {
    field: 'vencimento',
    label: 'Vencimento',
    type: 'chips-date-range',
    operators: [],
    chips: [
      { value: 'sem_vencimento', label: 'Sem Vencimento' },
      { value: 'vence_30', label: 'Vence em 30 dias' },
      { value: 'vence_hoje', label: 'Vence hoje' },
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
    if (c.field === 'vencimento') {
      if (typeof c.value === 'string') {
        if (c.value === 'sem_vencimento') return acc.filter((l) => l.sem_vencimento)
        if (c.value === 'vence_hoje')
          return acc.filter(
            (l) =>
              !l.sem_vencimento && l.expiration_date && getDaysRemaining(l.expiration_date) === 0,
          )
        if (c.value === 'vence_30')
          return acc.filter((l) => {
            if (l.sem_vencimento || !l.expiration_date) return false
            const d = getDaysRemaining(l.expiration_date)
            return d !== null && d >= 0 && d <= 30
          })
      } else if (c.value && typeof c.value === 'object') {
        const { start, end } = c.value as { start: string; end: string }
        return acc.filter(
          (l) =>
            l.expiration_date &&
            (!start || l.expiration_date >= start) &&
            (!end || l.expiration_date <= end),
        )
      }
    }
    return acc
  }, data)
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [search, setSearch] = useState('')
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [renewing, setRenewing] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<License | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isAdmin } = useAuth()

  const loadClients = useCallback(async () => {
    setClientsLoading(true)
    setClientsError(false)
    try {
      setClients(await getClients())
    } catch {
      setClientsError(true)
      toast.error('Erro Ao Carregar Lista De Clientes')
    } finally {
      setClientsLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLicenses(await getLicenses())
    } catch {
      toast.error('Erro Ao Carregar Licenças')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadClients()
  }, [loadData, loadClients])
  useRealtime('licenses', () => loadData())
  useRealtime('clients', () => loadClients())

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const l of licenses) {
      counts[l.status] = (counts[l.status] || 0) + 1
    }
    return counts
  }, [licenses])

  const filtered = useMemo(() => {
    let result = licenses
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
  }, [licenses, search, filterConditions])

  const openCreate = () => {
    setEditingLicense(null)
    setDialogOpen(true)
  }
  const openEdit = (license: License) => {
    setEditingLicense(license)
    setDialogOpen(true)
  }

  const handleStartRenewal = async (license: License) => {
    setRenewing(license.id)
    try {
      await startRenewal(license.id)
      toast.success(`Renovação iniciada para «${license.name}»`)
      loadData()
    } catch {
      toast.error('Erro Ao Iniciar Renovação')
    } finally {
      setRenewing(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteLicense(deleteTarget.id)
      toast.success(`Licença «${deleteTarget.name}» excluída`)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      loadData()
    } catch {
      toast.error('Erro Ao Excluir Licença')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))
  const someChecked = filtered.some((l) => selectedIds.has(l.id)) && !allChecked

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

  const summaryCards = [
    {
      label: 'Ativo',
      value: statusCounts['Ativo'] || 0,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bg: 'bg-green-500/10 backdrop-blur-sm',
      border: 'border-l-green-500',
    },
    {
      label: 'Pendente',
      value: statusCounts['Pendente'] || 0,
      icon: Clock,
      iconColor: 'text-yellow-600',
      bg: 'bg-yellow-500/10 backdrop-blur-sm',
      border: 'border-l-yellow-500',
    },
    {
      label: 'Vencido',
      value: statusCounts['Vencido'] || 0,
      icon: XCircle,
      iconColor: 'text-red-600',
      bg: 'bg-red-500/10 backdrop-blur-sm',
      border: 'border-l-red-500',
    },
    {
      label: 'Renovando',
      value: statusCounts['Renovando'] || 0,
      icon: RefreshCw,
      iconColor: 'text-blue-600',
      bg: 'bg-blue-500/10 backdrop-blur-sm',
      border: 'border-l-blue-500',
    },
    {
      label: 'Próximo ao Vencimento',
      value: statusCounts['Próxima ao Vencimento'] || 0,
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      bg: 'bg-orange-500/10 backdrop-blur-sm',
      border: 'border-l-orange-500',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck size={18} className="text-primary" />
          <span className="text-sm">Controle de licenças e vencimentos</span>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus size={16} /> Nova Licença
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.label}
              className={cn(
                'p-4 shadow-sm border-l-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                card.border,
              )}
            >
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
          <CardTitle className="text-title-case">Licenças da Empresa</CardTitle>
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
              Nenhuma licença encontrada.
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
                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground pr-4">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const nearExpiry = l.status === 'Próxima ao Vencimento'
                    const isExpired = l.status === 'Vencido'
                    return (
                      <TableRow
                        key={l.id}
                        className={cn(
                          'transition-colors',
                          nearExpiry && 'bg-amber-50 dark:bg-amber-950/20',
                          isExpired && 'bg-red-50 dark:bg-red-950/20',
                        )}
                      >
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
                          {l.status ? (
                            <Badge
                              variant="outline"
                              className={cn('rounded-full', licenseStatusBadge(l.status))}
                            >
                              {l.status}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4 pr-4">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                onClick={() => openEdit(l)}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => setDeleteTarget(l)}
                              >
                                <Trash2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                onClick={() => handleStartRenewal(l)}
                                disabled={renewing === l.id}
                              >
                                <PlayCircle size={16} />
                                <span className="hidden sm:inline">Iniciar Renovação</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
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

      <LicenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingLicense={editingLicense}
        clients={clients}
        clientsLoading={clientsLoading}
        clientsError={clientsError}
        onSuccess={loadData}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Licença</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a licença «{deleteTarget?.name}»? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

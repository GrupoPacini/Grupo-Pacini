import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Search,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlayCircle,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Client, getClients } from '@/services/api'
import { License, getLicenses, startRenewal } from '@/services/licenses'
import { LicenseFormDialog } from '@/components/LicenseFormDialog'
import { getDaysRemaining, statusOperacionalBadge } from '@/lib/license-utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [search, setSearch] = useState('')
  const [renewing, setRenewing] = useState<string | null>(null)

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

  const activeLicenses = useMemo(() => licenses.filter((l) => l.status === 'Ativo'), [licenses])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return activeLicenses.filter((l) => {
      const clientName = (l.expand?.client?.name || '').toLowerCase()
      const clientCnpj = l.expand?.client?.cnpj || ''
      const licenseName = (l.name || '').toLowerCase()
      return clientName.includes(q) || clientCnpj.includes(q) || licenseName.includes(q)
    })
  }, [activeLicenses, search])

  const nearExpirationCount = useMemo(
    () =>
      activeLicenses.filter((l) => {
        if (l.sem_vencimento) return false
        const days = getDaysRemaining(l.expiration_date)
        return days !== null && days >= 0 && days <= 30
      }).length,
    [activeLicenses],
  )

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

  const summaryCards = [
    {
      label: 'Licenças Ativas',
      value: activeLicenses.length,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Próximas ao Vencimento',
      value: nearExpirationCount,
      icon: Clock,
      iconColor: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
    },
  ]

  const renderExpiration = (l: License) => {
    if (l.sem_vencimento)
      return <span className="text-muted-foreground font-medium text-sm">Indeterminado</span>
    if (!l.expiration_date) return <span className="text-muted-foreground text-sm">—</span>
    const days = getDaysRemaining(l.expiration_date)
    const expiring = days !== null && days >= 0 && days <= 30
    return (
      <div className="flex flex-col">
        <span className={cn('text-sm', expiring && 'text-amber-600 font-semibold')}>
          {format(new Date(l.expiration_date), 'dd/MM/yyyy')}
        </span>
        {days !== null && days >= 0 && days <= 30 && (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 w-fit mt-0.5"
          >
            <AlertTriangle size={10} className="mr-1" />
            {days === 0 ? 'Vence hoje' : `${days} dias`}
          </Badge>
        )}
        {days !== null && days > 30 && (
          <span className="text-xs text-green-600 font-medium">{days} dias</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck size={18} className="text-primary" />
          <span className="text-sm">Licenças ativas e regulares</span>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus size={16} /> Nova Licença
        </Button>
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
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar por cliente, CNPJ ou licença..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
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
              Nenhuma licença ativa encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Licença</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Vencimento
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Status Op.
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Prioridade
                    </TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const days = l.sem_vencimento ? null : getDaysRemaining(l.expiration_date)
                    const nearExpiry = days !== null && days >= 0 && days <= 30
                    return (
                      <TableRow
                        key={l.id}
                        className={nearExpiry ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {l.expand?.client?.razao_social || l.expand?.client?.name || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {l.expand?.client?.cnpj || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{l.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{renderExpiration(l)}</TableCell>
                        <TableCell>
                          {l.status_operacional ? (
                            <Badge
                              variant="outline"
                              className={statusOperacionalBadge(l.status_operacional)}
                            >
                              {l.status_operacional}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {l.prioridade ? (
                            <Badge
                              variant="secondary"
                              className={cn(
                                l.prioridade === 'Alta' &&
                                  'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400',
                                l.prioridade === 'Média' &&
                                  'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
                                l.prioridade === 'Baixa' &&
                                  'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                              )}
                            >
                              {l.prioridade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
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
                              size="sm"
                              className="h-8 gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              onClick={() => handleStartRenewal(l)}
                              disabled={renewing === l.id}
                            >
                              <PlayCircle size={16} />
                              <span className="hidden sm:inline">Iniciar Renovação</span>
                            </Button>
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

      <LicenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingLicense={editingLicense}
        clients={clients}
        clientsLoading={clientsLoading}
        clientsError={clientsError}
        onSuccess={loadData}
      />
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Client, getClients } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtime } from '@/hooks/use-realtime'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGuard } from '@/components/PermissionGuard'
import { ClientActions } from '@/components/Clientes/ClientActions'
import { ClientFormDialog } from '@/components/Clientes/ClientFormDialog'
import { StatusChangeDialog } from '@/components/Clientes/StatusChangeDialog'
import { toast } from 'sonner'
import { Search, Plus, Users, UserCheck, UserPlus, X, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']
const ONBOARDING_STATUSES = ['Lead', 'Documentação', 'Configuração', 'Ativo']

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Ativo':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400'
    case 'Lead':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400'
    case 'Documentação':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
    case 'Configuração':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400'
  }
}

function regimeBadgeClass(regime: string): string {
  switch (regime) {
    case 'Simples Nacional':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400'
    case 'Lucro Presumido':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400'
    case 'Lucro Real':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regimeFilter, setRegimeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Client | null>(null)
  const { can } = usePermissions()

  const loadData = useCallback(async () => {
    try {
      setClients(await getClients())
    } catch {
      toast.error('Erro Ao Carregar Clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('clients', () => loadData())

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        const matches =
          c.name?.toLowerCase().includes(q) ||
          c.razao_social?.toLowerCase().includes(q) ||
          c.nome_fantasia?.toLowerCase().includes(q) ||
          c.alias?.toLowerCase().includes(q) ||
          c.cnpj?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q)
        if (!matches) return false
      }
      if (statusFilter !== 'all' && c.onboarding_status !== statusFilter) return false
      if (regimeFilter !== 'all' && c.tax_regime !== regimeFilter) return false
      return true
    })
  }, [clients, search, statusFilter, regimeFilter])

  const counts = useMemo(
    () => ({
      total: clients.length,
      ativos: clients.filter((c) => c.onboarding_status === 'Ativo').length,
      onboarding: clients.filter((c) => c.onboarding_status !== 'Ativo').length,
    }),
    [clients],
  )

  const hasFilters = search || statusFilter !== 'all' || regimeFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRegimeFilter('all')
  }

  const openCreate = () => {
    setEditingClient(null)
    setDialogOpen(true)
  }
  const openEdit = (client: Client) => {
    setEditingClient(client)
    setDialogOpen(true)
  }
  const openStatusChange = (client: Client) => {
    setStatusTarget(client)
    setStatusDialogOpen(true)
  }

  const indicatorCards = [
    {
      label: 'Total de Clientes',
      value: counts.total,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Clientes Ativos',
      value: counts.ativos,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Em Onboarding',
      value: counts.onboarding,
      icon: UserPlus,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Gestão de Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre, consulte e acompanhe as empresas atendidas pelo escritório.
        </p>
      </div>

      <PermissionGuard module="Clientes" action="criar">
        <div className="flex justify-end">
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus size={16} /> Novo Cliente
          </Button>
        </div>
      </PermissionGuard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {indicatorCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-4 shadow-sm border-l-4 border-l-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={`rounded-full p-3 ${card.bg}`}>
                  <Icon size={20} className={card.color} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 shadow-sm border-t-4 border-t-accent">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Buscar por razão social, nome fantasia, CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {ONBOARDING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={regimeFilter} onValueChange={setRegimeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Regime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Regimes</SelectItem>
              {TAX_REGIMES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters} className="shrink-0">
              <X size={16} />
            </Button>
          )}
        </div>
      </Card>

      <Card className="border-t-4 border-t-accent overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle>Lista de Clientes</CardTitle>
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
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground">
                      Razão Social
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Nome Fantasia
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">CNPJ</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Regime</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Atualização
                    </TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground pr-4">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="text-primary" size={16} />
                          </div>
                          <span className="font-medium text-foreground line-clamp-1">
                            {c.razao_social || c.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {c.nome_fantasia || c.alias || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-mono">
                          {c.cnpj || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.tax_regime ? (
                          <Badge variant="outline" className={regimeBadgeClass(c.tax_regime)}>
                            {c.tax_regime}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.onboarding_status ? (
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(c.onboarding_status)}
                          >
                            {c.onboarding_status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {c.updated
                            ? format(new Date(c.updated), 'dd/MM/yyyy', { locale: ptBR })
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <ClientActions
                          client={c}
                          onEdit={openEdit}
                          onStatusChange={openStatusChange}
                          canEdit={can('Clientes', 'editar')}
                          canManage={can('Clientes', 'gerenciar')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingClient={editingClient}
        onSuccess={loadData}
      />
      <StatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        client={statusTarget}
        onSuccess={loadData}
      />
    </div>
  )
}

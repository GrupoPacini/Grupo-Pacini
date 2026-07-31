import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Client, getClients } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
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
import { ClientesIndicatorCards } from '@/components/Clientes/ClientesIndicatorCards'
import { ClientFormDialog } from '@/components/Clientes/ClientFormDialog'
import { StatusChangeDialog } from '@/components/Clientes/StatusChangeDialog'
import { formatCnpj, getClientStatusLabel, getClientStatusBadgeClass } from '@/lib/client-utils'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  X,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']
const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Cadastro incompleto']
const PAGE_SIZES = [25, 50, 100]

export default function Clientes() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regimeFilter, setRegimeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Client | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const { can } = usePermissions()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setClients(await getClients())
    } catch {
      setError(true)
      toast.error('Erro ao carregar clientes')
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
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        if (
          !c.razao_social?.toLowerCase().includes(q) &&
          !c.nome_fantasia?.toLowerCase().includes(q) &&
          !c.cnpj?.toLowerCase().includes(q) &&
          !c.code?.toLowerCase().includes(q)
        )
          return false
      }
      if (statusFilter !== 'all' && getClientStatusLabel(c) !== statusFilter) return false
      if (regimeFilter !== 'all' && c.tax_regime !== regimeFilter) return false
      return true
    })
  }, [clients, debouncedSearch, statusFilter, regimeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, regimeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const hasFilters = debouncedSearch || statusFilter !== 'all' || regimeFilter !== 'all'
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRegimeFilter('all')
  }

  const openCreate = () => {
    navigate('/clientes/novo')
  }
  const openEdit = (client: Client) => {
    setEditingClient(client)
    setDialogOpen(true)
  }
  const openStatusChange = (client: Client) => {
    setStatusTarget(client)
    setStatusDialogOpen(true)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Consulte, cadastre e acompanhe as empresas atendidas pelo escritório.
          </p>
        </div>
        <PermissionGuard module="Clientes" action="criar">
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <Plus size={16} /> Novo cliente
          </Button>
        </PermissionGuard>
      </div>

      <ClientesIndicatorCards clients={clients} />

      <Card className="p-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Buscar por razão social, nome fantasia, CNPJ ou código..."
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
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
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
              <SelectItem value="all">Todos os regimes</SelectItem>
              {TAX_REGIMES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1 shrink-0">
              <X size={14} /> Limpar filtros
            </Button>
          )}
        </div>
        {hasFilters && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          </div>
        )}
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {error ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
              <p className="text-sm text-muted-foreground mb-3">Erro ao carregar clientes</p>
              <Button variant="outline" size="sm" onClick={loadData} className="gap-1">
                <RefreshCw size={14} /> Tentar novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="text-sm text-muted-foreground mb-3">Nenhum cliente cadastrado</p>
              <PermissionGuard module="Clientes" action="criar">
                <Button size="sm" onClick={openCreate} className="gap-1">
                  <Plus size={14} /> Criar primeiro cliente
                </Button>
              </PermissionGuard>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-3 text-muted-foreground" size={32} />
              <p className="text-sm text-muted-foreground mb-3">Nenhum resultado encontrado</p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                <X size={14} /> Limpar filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">CNPJ</TableHead>
                      <TableHead className="font-semibold">Regime</TableHead>
                      <TableHead className="font-semibold">Responsável</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Atualização</TableHead>
                      <TableHead className="text-right font-semibold pr-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/clientes/${c.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="text-primary" size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground line-clamp-1">
                                {c.razao_social || c.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {c.nome_fantasia || c.alias || '—'}
                              </p>
                              {c.code && (
                                <p className="text-xs text-muted-foreground/60">Cód: {c.code}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground font-mono">
                            {formatCnpj(c.cnpj)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {c.tax_regime ? (
                            <Badge variant="outline" className="text-xs">
                              {c.tax_regime}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">
                            {c.expand?.responsavel_interno?.name || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getClientStatusBadgeClass(c)}>
                            {getClientStatusLabel(c)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {c.updated
                              ? format(new Date(c.updated), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {filtered.length} registro(s)
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}/página
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
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

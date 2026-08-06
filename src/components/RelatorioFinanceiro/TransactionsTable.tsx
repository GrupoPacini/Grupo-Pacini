import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table2,
  Search,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  formatBRL,
  getTransactionStatusBadge,
  type Transaction,
  type DataState,
} from '@/lib/financial-utils'
import { cn } from '@/lib/utils'

type SortField =
  | 'date'
  | 'description'
  | 'category'
  | 'account'
  | 'project'
  | 'type'
  | 'value'
  | 'status'
type SortDir = 'asc' | 'desc'
const PAGE_SIZE = 10

const COLUMNS: { field: SortField; label: string }[] = [
  { field: 'date', label: 'Data' },
  { field: 'description', label: 'Descrição' },
  { field: 'category', label: 'Categoria' },
  { field: 'account', label: 'Conta' },
  { field: 'project', label: 'Projeto' },
  { field: 'type', label: 'Tipo' },
  { field: 'value', label: 'Valor' },
  { field: 'status', label: 'Status' },
]

function formatDateBR(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

export function TransactionsTable({
  data,
  state,
}: {
  data: Transaction[] | null
  state: DataState
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((t) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.account.toLowerCase().includes(q)
      const matchType = typeFilter === 'all' || t.type === typeFilter
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      return matchSearch && matchType && matchStatus
    })
  }, [data, search, typeFilter, statusFilter])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const cmp =
        sortField === 'value'
          ? a.value - b.value
          : String(a[sortField]).localeCompare(String(b[sortField]))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortField, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(0)
  }

  return (
    <Card className="border-t-4 border-t-accent shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Table2 size={18} className="text-primary" />
          <CardTitle className="text-base font-semibold">Lançamentos</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Buscar lançamentos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Receita">Receita</SelectItem>
              <SelectItem value="Despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-full sm:w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Pago">Pago</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {state === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-2 text-primary/60" />
            <p className="text-sm">Carregando lançamentos...</p>
          </div>
        ) : state === 'error' ? (
          <div className="flex flex-col items-center justify-center py-10 text-destructive">
            <AlertCircle size={24} className="mb-2 text-destructive/60" />
            <p className="text-sm">Erro ao carregar lançamentos</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Inbox size={24} className="mb-2 text-muted-foreground/40" />
            <p className="text-sm">Nenhum lançamento para exibir</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {COLUMNS.map((col) => (
                      <TableHead
                        key={col.field}
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => handleSort(col.field)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortField === col.field ? (
                            sortDir === 'asc' ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="opacity-30" />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateBR(t.date)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{t.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.category}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.account}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.project}</TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            t.type === 'Receita'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                          )}
                        >
                          {t.type}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-sm font-medium',
                          t.type === 'Receita' ? 'text-green-600' : 'text-red-600',
                        )}
                      >
                        {formatBRL(t.value)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                            getTransactionStatusBadge(t.status),
                          )}
                        >
                          {t.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">{sorted.length} lançamento(s)</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {page + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

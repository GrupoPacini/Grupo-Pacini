import { useEffect, useState } from 'react'
import {
  Process,
  Client,
  User,
  getProcesses,
  getClients,
  getDepartments,
  getUsers,
  Department,
  updateProcessStatus,
  updateProcessNotes,
  searchProcesses,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Filter, Calendar, Plus, List, LayoutGrid } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProcessCreateDialog } from '@/components/ProcessCreateDialog'
import { KanbanBoard } from '@/components/KanbanBoard'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Processos() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSearching, setIsSearching] = useState(false)

  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [p, d, c, u] = await Promise.all([
        getProcesses(),
        getDepartments(),
        getClients(),
        getUsers(),
      ])
      setProcesses(p)
      setDepartments(d)
      setClients(c)
      setUsers(u)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('processes', () => loadData())

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      loadData()
      return
    }
    setIsSearching(true)
    try {
      const res = await searchProcesses(search)
      setProcesses(res.items)
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro na busca',
        description: 'Não foi possível buscar processos.',
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Local filtering applies only if semantic search is empty
  let filtered = search.trim()
    ? processes
    : processes.filter((p) => {
        if (deptFilter !== 'all' && p.department !== deptFilter) return false
        if (viewMode === 'list' && statusFilter !== 'all' && p.status !== statusFilter) return false
        return true
      })

  const handleStatusChange = async (status: Process['status']) => {
    if (!selectedProcess) return
    try {
      await updateProcessStatus(selectedProcess.id, status)
      setSelectedProcess({ ...selectedProcess, status })
      toast({ title: 'Status Atualizado', description: `Processo movido para ${status}.` })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar.' })
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedProcess) return
    try {
      await updateProcessNotes(selectedProcess.id, notesDraft)
      setSelectedProcess({ ...selectedProcess, notes: notesDraft })
      toast({ title: 'Notas Atualizadas', description: 'Comentários salvos com sucesso.' })
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar notas.' })
    }
  }

  const handleKanbanStatusChange = async (id: string, status: Process['status']) => {
    try {
      await updateProcessStatus(id, status)
      setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
      toast({ title: 'Status Atualizado', description: `Processo movido para ${status}.` })
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar.' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {/* Filters */}
      <Card className="p-4 shadow-sm shrink-0 border-t-4 border-t-primary rounded-t-none">
        <div className="flex justify-end mb-4 gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List size={16} className="mr-1" /> Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-none"
            >
              <LayoutGrid size={16} className="mr-1" /> Kanban
            </Button>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <Plus size={16} />
            Novo Processo
          </Button>
        </div>
        <form
          onSubmit={handleSemanticSearch}
          className="flex flex-col md:flex-row gap-4 items-end md:items-center"
        >
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Busca semântica por título ou conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching} variant="secondary">
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>

          <div className="flex gap-2 w-full md:w-auto">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Departamentos</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </Card>

      {/* Table or Kanban */}
      {viewMode === 'kanban' ? (
        <KanbanBoard processes={filtered} onStatusChange={handleKanbanStatusChange} />
      ) : (
        <div className="bg-card rounded-lg shadow-sm border flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Processo</th>
                  <th className="px-6 py-4 font-medium">Depto.</th>
                  <th className="px-6 py-4 font-medium">Prazo</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedProcess(p)
                        setNotesDraft(p.notes || '')
                      }}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {p.expand?.client?.name}
                      </td>
                      <td className="px-6 py-4 text-foreground">{p.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {p.expand?.department?.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
                            p.status === 'Concluído'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : p.status === 'Atrasado'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : p.status === 'Em Andamento'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      <Sheet open={!!selectedProcess} onOpenChange={(o) => !o && setSelectedProcess(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-title-case text-xl text-primary">
              {selectedProcess?.title}
            </SheetTitle>
            <SheetDescription>
              {selectedProcess?.expand?.client?.name} • {selectedProcess?.expand?.department?.name}
            </SheetDescription>
          </SheetHeader>

          {selectedProcess && (
            <div className="space-y-8">
              {/* Status Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Mudar Status
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'].map((s) => (
                    <Button
                      key={s}
                      variant={selectedProcess.status === s ? 'default' : 'outline'}
                      className={selectedProcess.status === s ? 'bg-primary' : ''}
                      onClick={() => handleStatusChange(s as any)}
                      size="sm"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prazo Legal:</span>
                  <span className="font-medium text-foreground">
                    {selectedProcess.due_date
                      ? format(new Date(selectedProcess.due_date), 'dd/MM/yyyy')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="font-medium text-foreground">
                    {selectedProcess.expand?.responsible?.name || 'Não atribuído'}
                  </span>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Anotações Internas
                </h4>
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Detalhes sobre a execução do processo..."
                  className="min-h-[150px] resize-none"
                />
                <Button
                  onClick={handleSaveNotes}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  Salvar Anotações
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ProcessCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        departments={departments}
        users={users}
        onSuccess={loadData}
      />
    </div>
  )
}

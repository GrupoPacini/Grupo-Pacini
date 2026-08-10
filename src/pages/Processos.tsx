import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Process,
  Client,
  User,
  Department,
  getProcesses,
  getClients,
  getDepartments,
  getUsers,
  updateProcessStatus,
  deleteProcess,
} from '@/services/api'
import { getAllStages, type ProcessStage } from '@/services/process-stages'
import { useRealtime } from '@/hooks/use-realtime'
import { usePermissions } from '@/hooks/use-permissions'
import { Card } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { PROCESS_STATUSES, processStatusBadge, computeProgress } from '@/lib/process-utils'
import { ProcessIndicators } from '@/components/ProcessIndicators'
import { ProcessFormDialog } from '@/components/ProcessFormDialog'
import { ProcessDetailDrawer } from '@/components/ProcessDetailDrawer'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function Processos() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [stages, setStages] = useState<ProcessStage[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [detailProcess, setDetailProcess] = useState<Process | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Process | null>(null)
  const { can } = usePermissions()

  const loadData = useCallback(async () => {
    try {
      const [p, d, c, u, s] = await Promise.all([
        getProcesses(),
        getDepartments(),
        getClients(),
        getUsers(),
        getAllStages(),
      ])
      setProcesses(p)
      setDepartments(d)
      setClients(c)
      setUsers(u)
      setStages(s)
    } catch {
      /* ignored */
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('processes', () => loadData())
  useRealtime('process_stages', () => loadData())
  useRealtime('process_tasks', () => loadData())

  const progressMap = useMemo(() => {
    const map = new Map<string, number>()
    const byProcess = new Map<string, ProcessStage[]>()
    for (const s of stages) {
      const arr = byProcess.get(s.process) || []
      arr.push(s)
      byProcess.set(s.process, arr)
    }
    for (const [pid, stgs] of byProcess) {
      map.set(pid, computeProgress(stgs))
    }
    return map
  }, [stages])

  const filtered = useMemo(() => {
    return processes.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        const name = p.title.toLowerCase()
        const client = (p.expand?.client?.name || '').toLowerCase()
        if (!name.includes(q) && !client.includes(q)) return false
      }
      if (clientFilter !== 'all' && p.client !== clientFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (deptFilter !== 'all' && p.department !== deptFilter) return false
      return true
    })
  }, [processes, search, clientFilter, statusFilter, deptFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProcess(deleteTarget.id)
      toast.success('Processo Excluído')
      loadData()
    } catch {
      toast.error('Erro Ao Excluir Processo')
    }
    setDeleteTarget(null)
  }

  const handleQuickStatus = async (id: string, status: string) => {
    try {
      await updateProcessStatus(id, status)
      toast.success('Status Atualizado')
      loadData()
    } catch {
      toast.error('Erro Ao Atualizar Status')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ProcessIndicators processes={processes} />

      <Card className="p-4 shadow-sm border-t-4 border-t-primary rounded-t-none">
        <div className="flex justify-end mb-4">
          {can('Processos', 'criar') && (
            <Button
              onClick={() => {
                setEditingProcess(null)
                setFormOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus size={16} /> Novo Processo
            </Button>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Buscar por processo ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
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
              {PROCESS_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>
      </Card>

      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-3 font-medium">Processo</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Depto.</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Início</th>
                <th className="px-4 py-3 font-medium">Prazo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progresso</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setDetailProcess(p)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.expand?.client?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.expand?.department?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.expand?.responsible?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.start_date ? format(new Date(p.start_date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                          processStatusBadge(p.status),
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressMap.get(p.id) || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {progressMap.get(p.id) || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {can('Processos', 'editar') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingProcess(p)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                        )}
                        {can('Processos', 'excluir') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProcessFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clients={clients}
        departments={departments}
        users={users}
        editingProcess={editingProcess}
        onSuccess={loadData}
      />

      <ProcessDetailDrawer
        process={detailProcess}
        onOpenChange={(o) => !o && setDetailProcess(null)}
        users={users}
        canEdit={can('Processos', 'editar')}
        onRefresh={loadData}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Processo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o processo «{deleteTarget?.title}»? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

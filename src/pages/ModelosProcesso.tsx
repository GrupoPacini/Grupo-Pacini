import { useEffect, useState, useMemo, useCallback } from 'react'
import { ProcessModel, getModels, deleteModel } from '@/services/process-models'
import type { Department } from '@/services/api'
import { getDepartments } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { usePermissions } from '@/hooks/use-permissions'
import { Card } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { ModelFormDialog } from '@/components/Modelos/ModelFormDialog'
import { ModelDetailDrawer } from '@/components/Modelos/ModelDetailDrawer'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ModelosProcesso() {
  const [models, setModels] = useState<ProcessModel[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ProcessModel | null>(null)
  const [detailModel, setDetailModel] = useState<ProcessModel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProcessModel | null>(null)
  const { can } = usePermissions()

  const loadData = useCallback(async () => {
    try {
      const [m, d] = await Promise.all([getModels(), getDepartments()])
      setModels(m)
      setDepartments(d)
    } catch {
      /* ignored */
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('process_models', () => loadData())

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      if (deptFilter !== 'all' && m.department !== deptFilter) return false
      if (typeFilter !== 'all' && m.type !== typeFilter) return false
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      return true
    })
  }, [models, search, deptFilter, typeFilter, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteModel(deleteTarget.id)
      toast.success('Modelo Excluído')
      loadData()
    } catch {
      toast.error('Erro Ao Excluir Modelo')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-4 shadow-sm border-t-4 border-t-primary rounded-t-none">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Modelos de Processo</h3>
          {can('Modelos de Processo', 'gerenciar') && (
            <Button
              onClick={() => {
                setEditingModel(null)
                setFormOpen(true)
              }}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus size={16} /> Novo Modelo
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
              placeholder="Buscar modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="eventual">Eventual</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Departamento</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum modelo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[250px] truncate">
                      {m.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.expand?.department?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {m.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
                          m.status === 'ativo'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300',
                        )}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDetailModel(m)}
                        >
                          <Eye size={16} />
                        </Button>
                        {can('Modelos de Processo', 'gerenciar') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingModel(m)
                                setFormOpen(true)
                              }}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteTarget(m)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
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

      <ModelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        departments={departments}
        editingModel={editingModel}
        onSuccess={loadData}
      />

      <ModelDetailDrawer
        model={detailModel}
        onOpenChange={(o) => !o && setDetailModel(null)}
        canEdit={can('Modelos de Processo', 'gerenciar')}
        onRefresh={loadData}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo «{deleteTarget?.name}»? Esta ação não pode ser
              desfeita.
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

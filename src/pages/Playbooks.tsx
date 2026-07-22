import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Search, Plus, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Department, getDepartments } from '@/services/api'
import {
  Playbook,
  getPlaybooks,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  searchPlaybooks,
} from '@/services/playbooks'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

const emptyForm = { title: '', content: '', department: '' }

export default function Playbooks() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewing, setViewing] = useState<Playbook | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const { isAdmin } = useAuth()

  const loadData = async () => {
    try {
      const [p, d] = await Promise.all([getPlaybooks(), getDepartments()])
      setPlaybooks(p)
      setDepartments(d)
    } catch {
      toast.error('Erro Ao Carregar Playbooks')
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('playbooks', () => loadData())

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) {
      loadData()
      return
    }
    try {
      const res = await searchPlaybooks(search)
      setPlaybooks(res.items)
    } catch {
      toast.error('Erro Na Busca')
    }
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFieldErrors({})
    setDialogOpen(true)
  }
  const openEdit = (pb: Playbook) => {
    setForm({ title: pb.title, content: pb.content, department: pb.department || '' })
    setEditingId(pb.id)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    try {
      if (editingId) {
        await updatePlaybook(editingId, form)
        toast.success('Playbook Atualizado')
      } else {
        await createPlaybook(form)
        toast.success('Playbook Criado')
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Salvar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePlaybook(id)
      toast.success('Playbook Removido')
      loadData()
    } catch {
      toast.error('Erro Ao Remover')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Busca semântica em procedimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {isAdmin && (
          <Button
            type="button"
            onClick={openCreate}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus size={16} /> Novo
          </Button>
        )}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playbooks.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            Nenhum playbook encontrado.
          </p>
        ) : (
          playbooks.map((pb) => (
            <Card
              key={pb.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setViewing(pb)
                setViewOpen(true)
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="text-primary" size={20} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(pb)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive"
                        onClick={() => handleDelete(pb.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{pb.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{pb.content}</p>
                {pb.expand?.department && (
                  <Badge variant="secondary" className="mt-2">
                    {pb.expand.department.name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Playbook' : 'Novo Playbook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título do procedimento"
              />
              {fieldErrors.title && <p className="text-sm text-destructive">{fieldErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Departamento</Label>
              <Select
                value={form.department || '__none__'}
                onValueChange={(v) => setForm({ ...form, department: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Nenhum —</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Conteúdo</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Descreva o procedimento..."
                className="min-h-[200px] resize-none"
              />
              {fieldErrors.content && (
                <p className="text-sm text-destructive">{fieldErrors.content}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            {viewing?.expand?.department && (
              <Badge variant="secondary" className="mb-3">
                {viewing.expand.department.name}
              </Badge>
            )}
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
              {viewing?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Client, getClients, createClient, updateClient, deleteClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Search, Plus, Pencil, Trash2, Building2, FileText, BadgePercent } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']

interface FormState {
  name: string
  cnpj: string
  tax_regime: string
  code: string
  alias: string
  onboarding_status: string
}

const emptyForm: FormState = {
  name: '',
  cnpj: '',
  tax_regime: '',
  code: '',
  alias: '',
  onboarding_status: '',
}

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { isAdmin } = useAuth()

  const loadData = useCallback(async () => {
    try {
      const data = await getClients()
      setClients(data)
    } catch {
      toast.error('Erro Ao Carregar Clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('clients', () => {
    loadData()
  })

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj?.includes(search) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.alias?.toLowerCase().includes(search.toLowerCase()),
  )

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const openEdit = (client: Client) => {
    setForm({
      name: client.name || '',
      cnpj: client.cnpj || '',
      tax_regime: client.tax_regime || '',
      code: client.code || '',
      alias: client.alias || '',
      onboarding_status: client.onboarding_status || '',
    })
    setEditingId(client.id)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    const payload = {
      ...form,
      tax_regime: form.tax_regime || undefined,
    }
    try {
      if (editingId) {
        await updateClient(editingId, payload)
        toast.success('Cliente Atualizado Com Sucesso')
      } else {
        await createClient(payload)
        toast.success('Cliente Criado Com Sucesso')
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Salvar Cliente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteClient(deleteTarget.id)
      toast.success('Cliente Removido Com Sucesso')
      setDeleteTarget(null)
      loadData()
    } catch {
      toast.error('Erro Ao Remover Cliente')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar Por Nome, CNPJ, Código Ou Apelido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus size={16} />
            Novo Cliente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Lead', 'Documentação', 'Configuração', 'Ativo'].map((stage) => {
          const count = clients.filter((c) => c.onboarding_status === stage).length
          return (
            <Card key={stage} className="p-4">
              <p className="text-xs text-muted-foreground text-title-case">{stage}</p>
              <p className="text-2xl font-bold text-primary mt-1">{count}</p>
            </Card>
          )
        })}
      </div>

      <Card className="border-t-4 border-t-accent overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-title-case">Lista De Clientes</CardTitle>
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
              Nenhum Cliente Encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-title-case font-semibold text-muted-foreground">
                      Cliente
                    </TableHead>
                    <TableHead className="text-title-case font-semibold text-muted-foreground">
                      Código
                    </TableHead>
                    <TableHead className="text-title-case font-semibold text-muted-foreground">
                      Apelido
                    </TableHead>
                    <TableHead className="text-title-case font-semibold text-muted-foreground">
                      CNPJ
                    </TableHead>
                    <TableHead className="text-title-case font-semibold text-muted-foreground">
                      Regime Tributário
                    </TableHead>
                    <TableHead className="text-right text-title-case font-semibold text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="text-primary" size={16} />
                          </div>
                          <span className="font-medium text-foreground line-clamp-1" title={c.name}>
                            {c.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.code ? (
                          <span className="font-mono text-sm text-accent font-medium">
                            {c.code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.alias ? (
                          <span className="text-sm text-foreground">{c.alias}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <FileText size={14} className="text-muted-foreground/60" />
                          {c.cnpj || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.tax_regime ? (
                          <Badge variant="secondary" className="text-title-case">
                            <BadgePercent size={12} className="mr-1 text-accent" />
                            {c.tax_regime}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-title-case">
              {editingId ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-title-case text-sm font-medium">
                Nome Do Cliente
              </Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Razão Social"
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-code" className="text-title-case text-sm font-medium">
                  Código Do Cliente
                </Label>
                <Input
                  id="client-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="001"
                  className="font-mono"
                />
                {fieldErrors.code && <p className="text-sm text-destructive">{fieldErrors.code}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-alias" className="text-title-case text-sm font-medium">
                  Apelido
                </Label>
                <Input
                  id="client-alias"
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  placeholder="Nome Fantasia"
                />
                {fieldErrors.alias && (
                  <p className="text-sm text-destructive">{fieldErrors.alias}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-cnpj" className="text-title-case text-sm font-medium">
                CNPJ
              </Label>
              <Input
                id="client-cnpj"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
              {fieldErrors.cnpj && <p className="text-sm text-destructive">{fieldErrors.cnpj}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-title-case text-sm font-medium">Regime Tributário</Label>
              <Select
                value={form.tax_regime || '__none__'}
                onValueChange={(v) => setForm({ ...form, tax_regime: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione Um Regime (Opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Nenhum —</SelectItem>
                  {TAX_REGIMES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.tax_regime && (
                <p className="text-sm text-destructive">{fieldErrors.tax_regime}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-title-case text-sm font-medium">Status De Onboarding</Label>
            <Select
              value={form.onboarding_status || '__none__'}
              onValueChange={(v) =>
                setForm({ ...form, onboarding_status: v === '__none__' ? '' : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Nenhum —</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Documentação">Documentação</SelectItem>
                <SelectItem value="Configuração">Configuração</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
              </SelectContent>
            </Select>
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
              {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title-case">Remover Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o cliente "{deleteTarget?.name}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

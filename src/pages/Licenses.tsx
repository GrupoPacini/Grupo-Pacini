import { useCallback, useEffect, useState } from 'react'
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
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, ShieldCheck, AlertTriangle, Upload, FileText } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Client, User, getClients, getUsers } from '@/services/api'
import { ClientCombobox } from '@/components/ClientCombobox'
import { License, getLicenses, createLicense, updateLicense } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import {
  PRIORIDADES,
  STATUS_VENCIMENTO,
  STATUS_OPERACIONAL,
  LICENSE_STATUS,
  getDaysRemaining,
  statusVencimentoBadge,
  statusOperacionalBadge,
} from '@/lib/license-utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface FormState {
  name: string
  client: string
  status: string
  numero_licenca: string
  numero_protocolo: string
  orgao_emissor: string
  data_emissao: string
  expiration_date: string
  responsible: string
  prioridade: string
  proxima_acao: string
  pendencia_atual: string
  observacoes: string
  status_operacional: string
  status_vencimento: string
  document: File | null
}

const emptyForm: FormState = {
  name: '',
  client: '',
  status: '',
  numero_licenca: '',
  numero_protocolo: '',
  orgao_emissor: '',
  data_emissao: '',
  expiration_date: '',
  responsible: '',
  prioridade: '',
  proxima_acao: '',
  pendencia_atual: '',
  observacoes: '',
  status_operacional: '',
  status_vencimento: '',
  document: null,
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDoc, setEditingDoc] = useState<string>('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatusOp, setFilterStatusOp] = useState('all')
  const [filterStatusVenc, setFilterStatusVenc] = useState('all')
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState(false)

  const loadClients = useCallback(async () => {
    setClientsLoading(true)
    setClientsError(false)
    try {
      const c = await getClients()
      setClients(c)
    } catch {
      setClientsError(true)
      toast.error('Erro Ao Carregar Lista De Clientes')
    } finally {
      setClientsLoading(false)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [l, u] = await Promise.all([getLicenses(), getUsers()])
      setLicenses(l)
      setUsers(u)
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

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setEditingDoc('')
    setFieldErrors({})
    setDialogOpen(true)
  }

  const openEdit = (license: License) => {
    setForm({
      name: license.name || '',
      client: license.client || '',
      status: license.status || '',
      numero_licenca: license.numero_licenca || '',
      numero_protocolo: license.numero_protocolo || '',
      orgao_emissor: license.orgao_emissor || '',
      data_emissao: license.data_emissao || '',
      expiration_date: license.expiration_date || '',
      responsible: license.responsible || '',
      prioridade: license.prioridade || '',
      proxima_acao: license.proxima_acao || '',
      pendencia_atual: license.pendencia_atual || '',
      observacoes: license.observacoes || '',
      status_operacional: license.status_operacional || '',
      status_vencimento: license.status_vencimento || '',
      document: null,
    })
    setEditingId(license.id)
    setEditingDoc(license.document || '')
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    if (!form.client) {
      setFieldErrors({ client: 'Selecione um cliente para continuar.' })
      setSubmitting(false)
      return
    }
    const payload: Record<string, unknown> = {
      name: form.name,
      client: form.client || undefined,
      status: form.status || undefined,
      numero_licenca: form.numero_licenca || undefined,
      numero_protocolo: form.numero_protocolo || undefined,
      orgao_emissor: form.orgao_emissor || undefined,
      data_emissao: form.data_emissao || undefined,
      expiration_date: form.expiration_date || undefined,
      responsible: form.responsible || undefined,
      prioridade: form.prioridade || undefined,
      proxima_acao: form.proxima_acao || undefined,
      pendencia_atual: form.pendencia_atual || undefined,
      observacoes: form.observacoes || undefined,
      status_operacional: form.status_operacional || undefined,
      status_vencimento: form.status_vencimento || undefined,
    }
    try {
      if (form.document) {
        const formData = new FormData()
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value))
          }
        })
        formData.append('document', form.document)
        if (editingId) {
          await updateLicense(editingId, formData)
        } else {
          await createLicense(formData)
        }
      } else {
        if (editingId) {
          await updateLicense(editingId, payload)
        } else {
          await createLicense(payload)
        }
      }
      toast.success(editingId ? 'Licença Atualizada' : 'Licença Criada')
      setDialogOpen(false)
      setForm(emptyForm)
      loadData()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro Ao Salvar Licença')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = licenses.filter((l) => {
    const clientName = l.expand?.client?.name || ''
    const clientCnpj = l.expand?.client?.cnpj || ''
    const licenseName = l.name || ''
    const matchesSearch =
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      clientCnpj.includes(search) ||
      licenseName.toLowerCase().includes(search.toLowerCase())
    const matchesStatusOp = filterStatusOp === 'all' || l.status_operacional === filterStatusOp
    const matchesStatusVenc = filterStatusVenc === 'all' || l.status_vencimento === filterStatusVenc
    return matchesSearch && matchesStatusOp && matchesStatusVenc
  })

  const renderDaysRemaining = (l: License, days: number | null) => {
    if (l.status_vencimento === 'Indeterminado' || l.status_vencimento === 'Pendente') {
      return <span className="text-muted-foreground text-xs">{l.status_vencimento}</span>
    }
    if (days === null) {
      return <span className="text-muted-foreground">—</span>
    }
    if (days < 0) {
      return <span className="text-destructive font-semibold">Vencida</span>
    }
    return (
      <span className={cn('font-medium', days <= 30 ? 'text-orange-600' : 'text-green-600')}>
        {days}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle size={18} className="text-destructive" />
          <span className="text-sm">Licenças em vermelho expiram em até 30 dias</span>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus size={16} /> Nova Licença
        </Button>
      </div>

      <Card className="p-4 shadow-sm border-t-4 border-t-accent">
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
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
          <Select value={filterStatusOp} onValueChange={setFilterStatusOp}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Status Operacional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Operacional</SelectItem>
              {STATUS_OPERACIONAL.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatusVenc} onValueChange={setFilterStatusVenc}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status Vencimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Vencimento</SelectItem>
              {STATUS_VENCIMENTO.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-t-4 border-t-accent overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-title-case">Controle de Licenças E Certificados</CardTitle>
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
                    <TableHead className="font-semibold text-muted-foreground">Código</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Apelido</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Razão Social
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">CNPJ</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Status Cliente
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Licença</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Nº / Protocolo
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Observação
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Vencimento
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Dias Rest.
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Status Venc.
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Status Op.
                    </TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const days = getDaysRemaining(l.expiration_date)
                    const expiring = days !== null && days >= 0 && days <= 30
                    const expired = days !== null && days < 0
                    return (
                      <TableRow
                        key={l.id}
                        className={expiring || expired ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell className="font-mono text-sm text-accent">
                          {l.expand?.client?.code || '—'}
                        </TableCell>
                        <TableCell className="text-sm">{l.expand?.client?.alias || '—'}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {l.expand?.client?.razao_social || l.expand?.client?.name || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.expand?.client?.cnpj || '—'}
                        </TableCell>
                        <TableCell>
                          {l.expand?.client?.onboarding_status ? (
                            <Badge variant="outline">{l.expand.client.onboarding_status}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{l.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.numero_licenca || l.numero_protocolo || '—'}
                        </TableCell>
                        <TableCell
                          className="text-sm text-muted-foreground max-w-[200px] truncate"
                          title={l.observacoes || ''}
                        >
                          {l.observacoes || '—'}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-sm',
                            (expiring || expired) && 'text-destructive font-medium',
                          )}
                        >
                          {l.expiration_date
                            ? format(new Date(l.expiration_date), 'dd/MM/yyyy')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {renderDaysRemaining(l, days)}
                        </TableCell>
                        <TableCell>
                          {l.status_vencimento ? (
                            <Badge
                              variant="outline"
                              className={statusVencimentoBadge(l.status_vencimento)}
                            >
                              {l.status_vencimento}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openEdit(l)}
                          >
                            <Pencil size={16} />
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-title-case">
              {editingId ? 'Editar Licença' : 'Nova Licença'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <ClientCombobox
                clients={clients}
                value={form.client}
                onChange={(v) => setForm({ ...form, client: v })}
                loading={clientsLoading}
                error={clientsError}
                invalid={!!fieldErrors.client}
              />
              {fieldErrors.client && (
                <p className="text-sm text-destructive">{fieldErrors.client}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome da Licença</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Certificado Digital A1"
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número da Licença</Label>
                <Input
                  value={form.numero_licenca}
                  onChange={(e) => setForm({ ...form, numero_licenca: e.target.value })}
                  placeholder="Nº da licença"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nº de Protocolo</Label>
                <Input
                  value={form.numero_protocolo}
                  onChange={(e) => setForm({ ...form, numero_protocolo: e.target.value })}
                  placeholder="Protocolo"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Órgão Emissor</Label>
                <Input
                  value={form.orgao_emissor}
                  onChange={(e) => setForm({ ...form, orgao_emissor: e.target.value })}
                  placeholder="Ex: Receita Federal"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={form.status || '__none__'}
                  onValueChange={(v) => setForm({ ...form, status: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {LICENSE_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prioridade</Label>
                <Select
                  value={form.prioridade || '__none__'}
                  onValueChange={(v) => setForm({ ...form, prioridade: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Responsável Interno</Label>
                <Select
                  value={form.responsible || '__none__'}
                  onValueChange={(v) =>
                    setForm({ ...form, responsible: v === '__none__' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Emissão</Label>
                <Input
                  type="date"
                  value={form.data_emissao}
                  onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Vencimento</Label>
                <Input
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Próxima Ação</Label>
              <Input
                value={form.proxima_acao}
                onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
                placeholder="Próximo passo"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pendência Atual</Label>
              <Input
                value={form.pendencia_atual}
                onChange={(e) => setForm({ ...form, pendencia_atual: e.target.value })}
                placeholder="Pendência atual"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status Operacional</Label>
                <Select
                  value={form.status_operacional || '__none__'}
                  onValueChange={(v) =>
                    setForm({ ...form, status_operacional: v === '__none__' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {STATUS_OPERACIONAL.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status de Vencimento</Label>
                <Select
                  value={form.status_vencimento || '__none__'}
                  onValueChange={(v) =>
                    setForm({ ...form, status_vencimento: v === '__none__' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {STATUS_VENCIMENTO.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações</Label>
              <Input
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Documento (PDF, JPG, PNG)</Label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md hover:bg-muted/50 transition-colors">
                    <Upload size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {form.document ? form.document.name : 'Selecionar arquivo...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setForm({ ...form, document: file })
                    }}
                  />
                </label>
                {editingDoc && !form.document && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText size={14} />
                    <span className="truncate max-w-[120px]" title={editingDoc}>
                      {editingDoc}
                    </span>
                  </div>
                )}
              </div>
              {fieldErrors.document && (
                <p className="text-sm text-destructive">{fieldErrors.document}</p>
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
              {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { Plus, Search, Pencil, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Client, User, getClients, getUsers } from '@/services/api'
import { License, getLicenses, createLicense, updateLicense } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'

const PRIORIDADES = ['Baixa', 'Média', 'Alta']
const STATUS_VENCIMENTO = ['Regular', 'Vencida', 'Indeterminado', 'Pendente']
const STATUS_OPERACIONAL = [
  'Regular',
  'Em Atenção',
  'Próxima Vencimento',
  'Vencida',
  'Sem Vencimento Informado',
  'Em Renovação',
  'Aguardando Cliente',
  'Em Análise Órgão',
  'Com Exigência',
  'Concluída',
]

interface FormState {
  name: string
  client: string
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
}

const emptyForm: FormState = {
  name: '',
  client: '',
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
}

function getDaysRemaining(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

function statusVencimentoBadge(status: string) {
  const map: Record<string, string> = {
    Regular: 'bg-green-100 text-green-700 border-green-300',
    Vencida: 'bg-red-100 text-red-700 border-red-300',
    Indeterminado: 'bg-gray-100 text-gray-600 border-gray-300',
    Pendente: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-300'
}

function statusOperacionalBadge(status: string) {
  const map: Record<string, string> = {
    Regular: 'bg-green-100 text-green-700 border-green-300',
    'Em Atenção': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'Próxima Vencimento': 'bg-orange-100 text-orange-700 border-orange-300',
    Vencida: 'bg-red-100 text-red-700 border-red-300',
    'Sem Vencimento Informado': 'bg-gray-100 text-gray-600 border-gray-300',
    'Em Renovação': 'bg-blue-100 text-blue-700 border-blue-300',
    'Aguardando Cliente': 'bg-purple-100 text-purple-700 border-purple-300',
    'Em Análise Órgão': 'bg-cyan-100 text-cyan-700 border-cyan-300',
    'Com Exigência': 'bg-red-100 text-red-700 border-red-300',
    Concluída: 'bg-green-100 text-green-700 border-green-300',
  }
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-300'
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatusOp, setFilterStatusOp] = useState('all')
  const [filterStatusVenc, setFilterStatusVenc] = useState('all')

  const loadData = useCallback(async () => {
    try {
      const [l, c, u] = await Promise.all([getLicenses(), getClients(), getUsers()])
      setLicenses(l)
      setClients(c)
      setUsers(u)
    } catch {
      toast.error('Erro Ao Carregar Licenças')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('licenses', () => loadData())

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const openEdit = (license: License) => {
    setForm({
      name: license.name || '',
      client: license.client || '',
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
    })
    setEditingId(license.id)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})
    const payload: Record<string, unknown> = {
      name: form.name,
      client: form.client || undefined,
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
      if (editingId) {
        await updateLicense(editingId, payload)
        toast.success('Licença Atualizada')
      } else {
        await createLicense(payload)
        toast.success('Licença Criada')
      }
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
          <CardTitle className="text-title-case">Controle De Licenças E Certificados</CardTitle>
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
                          className={
                            expiring || expired ? 'text-destructive font-medium text-sm' : 'text-sm'
                          }
                        >
                          {l.expiration_date
                            ? format(new Date(l.expiration_date), 'dd/MM/yyyy')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {days === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={
                                expired
                                  ? 'text-destructive'
                                  : expiring
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                              }
                            >
                              {days}
                            </span>
                          )}
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
              <Label className="text-sm font-medium">Cliente</Label>
              <Select
                value={form.client || '__none__'}
                onValueChange={(v) => setForm({ ...form, client: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label className="text-sm font-medium">Responsável Interno</Label>
              <Select
                value={form.responsible || '__none__'}
                onValueChange={(v) => setForm({ ...form, responsible: v === '__none__' ? '' : v })}
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

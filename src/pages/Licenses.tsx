import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Client, getClients } from '@/services/api'
import { ClientCombobox } from '@/components/ClientCombobox'
import { License, getLicenses, createLicense, updateLicense } from '@/services/licenses'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import {
  PRIORIDADES,
  STATUS_OPERACIONAL,
  LICENSE_STATUS,
  getDaysRemaining,
  statusOperacionalBadge,
} from '@/lib/license-utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface FormState {
  name: string
  client: string
  status: string
  numero_protocolo: string
  expiration_date: string
  sem_vencimento: boolean
  prioridade: string
  pendencia_atual: string
  observacoes: string
  status_operacional: string
}

const emptyForm: FormState = {
  name: '',
  client: '',
  status: '',
  numero_protocolo: '',
  expiration_date: '',
  sem_vencimento: false,
  prioridade: '',
  pendencia_atual: '',
  observacoes: '',
  status_operacional: '',
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatusOp, setFilterStatusOp] = useState('all')
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
      const l = await getLicenses()
      setLicenses(l)
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
    setFieldErrors({})
    setDialogOpen(true)
  }

  const openEdit = (license: License) => {
    setForm({
      name: license.name || '',
      client: license.client || '',
      status: license.status || '',
      numero_protocolo: license.numero_protocolo || '',
      expiration_date: license.expiration_date || '',
      sem_vencimento: license.sem_vencimento || false,
      prioridade: license.prioridade || '',
      pendencia_atual: license.pendencia_atual || '',
      observacoes: license.observacoes || '',
      status_operacional: license.status_operacional || '',
    })
    setEditingId(license.id)
    setFieldErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFieldErrors({})

    let hasError = false
    const errors: FieldErrors = {}

    if (!form.client) {
      errors.client = 'Selecione um cliente para continuar.'
      hasError = true
    }
    if (!form.name || !form.name.trim()) {
      errors.name = 'Nome da licença é obrigatório.'
      hasError = true
    }
    if (!form.sem_vencimento && !form.expiration_date) {
      errors.expiration_date = 'Data de vencimento é obrigatória quando não for indeterminada.'
      hasError = true
    }

    if (hasError) {
      setFieldErrors(errors)
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      client: form.client || undefined,
      status: form.status || undefined,
      numero_protocolo: form.numero_protocolo || undefined,
      expiration_date: form.sem_vencimento ? '' : form.expiration_date || undefined,
      sem_vencimento: form.sem_vencimento,
      prioridade: form.prioridade || undefined,
      pendencia_atual: form.pendencia_atual || undefined,
      observacoes: form.observacoes || undefined,
      status_operacional: form.status_operacional || undefined,
    }
    try {
      if (editingId) {
        await updateLicense(editingId, payload)
      } else {
        await createLicense(payload)
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
    return matchesSearch && matchesStatusOp
  })

  const renderExpiration = (l: License) => {
    if (l.sem_vencimento) {
      return <span className="text-muted-foreground font-medium text-sm">Indeterminado</span>
    }
    if (!l.expiration_date) {
      return <span className="text-muted-foreground text-sm">—</span>
    }
    const days = getDaysRemaining(l.expiration_date)
    const expiring = days !== null && days >= 0 && days <= 30
    const expired = days !== null && days < 0
    return (
      <div className="flex flex-col">
        <span className={cn('text-sm', (expiring || expired) && 'text-destructive font-medium')}>
          {format(new Date(l.expiration_date), 'dd/MM/yyyy')}
        </span>
        {days !== null && (
          <span
            className={cn(
              'text-xs font-medium',
              days < 0 ? 'text-destructive' : days <= 30 ? 'text-orange-600' : 'text-green-600',
            )}
          >
            {days < 0 ? 'Vencida' : `${days} dias`}
          </span>
        )}
      </div>
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
                    <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Licença</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Nº Protocolo
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Prioridade
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Vencimento
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
                    const days = l.sem_vencimento ? null : getDaysRemaining(l.expiration_date)
                    const expiring = days !== null && days >= 0 && days <= 30
                    const expired = days !== null && days < 0
                    return (
                      <TableRow
                        key={l.id}
                        className={expiring || expired ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {l.expand?.client?.razao_social || l.expand?.client?.name || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {l.expand?.client?.cnpj || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm">{l.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.numero_protocolo || '—'}
                        </TableCell>
                        <TableCell>
                          {l.prioridade ? (
                            <Badge
                              variant="secondary"
                              className={cn(
                                l.prioridade === 'Alta' &&
                                  'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400',
                                l.prioridade === 'Média' &&
                                  'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
                                l.prioridade === 'Baixa' &&
                                  'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                              )}
                            >
                              {l.prioridade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>{renderExpiration(l)}</TableCell>
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
                <Label className="text-sm font-medium">Número do Protocolo</Label>
                <Input
                  value={form.numero_protocolo}
                  onChange={(e) => setForm({ ...form, numero_protocolo: e.target.value })}
                  placeholder="Protocolo"
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
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data de Vencimento</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                  disabled={form.sem_vencimento}
                  className={cn('flex-1', form.sem_vencimento && 'opacity-50')}
                />
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Checkbox
                    id="sem_vencimento"
                    checked={form.sem_vencimento}
                    onCheckedChange={(checked) =>
                      setForm({
                        ...form,
                        sem_vencimento: checked === true,
                        expiration_date: checked === true ? '' : form.expiration_date,
                      })
                    }
                  />
                  <Label htmlFor="sem_vencimento" className="text-sm font-medium cursor-pointer">
                    Sem Vencimento
                  </Label>
                </div>
              </div>
              {fieldErrors.expiration_date && (
                <p className="text-sm text-destructive">{fieldErrors.expiration_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Pendência Atual</Label>
              <Input
                value={form.pendencia_atual}
                onChange={(e) => setForm({ ...form, pendencia_atual: e.target.value })}
                placeholder="Pendência atual"
              />
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

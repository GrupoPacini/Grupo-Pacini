import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Plus,
  Search,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  RefreshCw,
  XCircle,
  ClipboardList,
} from 'lucide-react'
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
  ETAPAS_RENOVACAO,
  getDaysRemaining,
  statusOperacionalBadge,
  etapaRenovacaoBadge,
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
  etapa_renovacao: string
  documentos_pendentes: string
  data_renovacao_inicio: string
  renovacao_ativa: boolean
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
  etapa_renovacao: '',
  documentos_pendentes: '',
  data_renovacao_inicio: '',
  renovacao_ativa: false,
}

type TabValue = 'all' | 'ativas' | 'renovacao' | 'vencidas'

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
  const [activeTab, setActiveTab] = useState<TabValue>('all')
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

  const counts = useMemo(() => {
    const total = licenses.length
    const ativas = licenses.filter((l) => l.status === 'Ativo').length
    const renovacao = licenses.filter(
      (l) => l.status_operacional === 'Em Renovação' || l.status === 'Renovando',
    ).length
    const vencidas = licenses.filter((l) => l.status === 'Expirado').length
    return { total, ativas, renovacao, vencidas }
  }, [licenses])

  const filtered = useMemo(() => {
    return licenses.filter((l) => {
      const clientName = l.expand?.client?.name || ''
      const clientCnpj = l.expand?.client?.cnpj || ''
      const licenseName = l.name || ''
      const matchesSearch =
        clientName.toLowerCase().includes(search.toLowerCase()) ||
        clientCnpj.includes(search) ||
        licenseName.toLowerCase().includes(search.toLowerCase())

      let matchesTab = true
      if (activeTab === 'ativas') {
        matchesTab = l.status === 'Ativo' && l.status_operacional === 'Regular'
      } else if (activeTab === 'renovacao') {
        matchesTab = [
          'Em Renovação',
          'Aguardando Cliente',
          'Em Análise Órgão',
          'Com Exigência',
        ].includes(l.status_operacional || '')
      } else if (activeTab === 'vencidas') {
        matchesTab = l.status === 'Expirado' || l.status_operacional === 'Vencida'
      }

      return matchesSearch && matchesTab
    })
  }, [licenses, search, activeTab])

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
      etapa_renovacao: license.etapa_renovacao || '',
      documentos_pendentes: license.documentos_pendentes || '',
      data_renovacao_inicio: license.data_renovacao_inicio || '',
      renovacao_ativa: !!(license.etapa_renovacao || license.data_renovacao_inicio),
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
      etapa_renovacao: form.renovacao_ativa ? form.etapa_renovacao || undefined : undefined,
      documentos_pendentes: form.renovacao_ativa
        ? form.documentos_pendentes || undefined
        : undefined,
      data_renovacao_inicio: form.renovacao_ativa
        ? form.data_renovacao_inicio || undefined
        : undefined,
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

  const summaryCards = [
    {
      label: 'Total de Licenças',
      value: counts.total,
      icon: ClipboardList,
      iconColor: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Ativas',
      value: counts.ativas,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      label: 'Em Renovação',
      value: counts.renovacao,
      icon: RefreshCw,
      iconColor: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Vencidas',
      value: counts.vencidas,
      icon: XCircle,
      iconColor: 'text-destructive',
      bg: 'bg-red-100 dark:bg-red-900/20',
    },
  ]

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="p-4 shadow-sm border-t-4 border-t-accent">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={cn('rounded-full p-3', card.bg)}>
                  <Icon size={20} className={card.iconColor} />
                </div>
              </div>
            </Card>
          )
        })}
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
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="ativas">Ativas</TabsTrigger>
          <TabsTrigger value="renovacao">Em Renovação</TabsTrigger>
          <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
        </TabsList>
      </Tabs>

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
                      Vencimento
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Status Op.
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Etapa Renovação
                    </TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Alertas</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">
                      Prioridade
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
                    const hasPendingDocs = !!l.documentos_pendentes?.trim()
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
                        <TableCell>
                          {l.etapa_renovacao ? (
                            <Badge
                              variant="outline"
                              className={etapaRenovacaoBadge(l.etapa_renovacao)}
                            >
                              {l.etapa_renovacao}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasPendingDocs ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center">
                                    <FileWarning
                                      size={18}
                                      className="text-orange-600 dark:text-orange-400 cursor-help"
                                    />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs font-semibold mb-1">
                                    Documentos Pendentes:
                                  </p>
                                  <p className="text-xs whitespace-pre-wrap">
                                    {l.documentos_pendentes}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
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

            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="renovacao_ativa"
                  checked={form.renovacao_ativa}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      renovacao_ativa: checked === true,
                      etapa_renovacao: checked === true ? form.etapa_renovacao : '',
                      data_renovacao_inicio: checked === true ? form.data_renovacao_inicio : '',
                      documentos_pendentes: checked === true ? form.documentos_pendentes : '',
                    })
                  }
                />
                <Label htmlFor="renovacao_ativa" className="text-sm font-semibold cursor-pointer">
                  Processo de Renovação
                </Label>
              </div>
              {form.renovacao_ativa && (
                <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Etapa de Renovação</Label>
                      <Select
                        value={form.etapa_renovacao || '__none__'}
                        onValueChange={(v) =>
                          setForm({ ...form, etapa_renovacao: v === '__none__' ? '' : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {ETAPAS_RENOVACAO.map((e) => (
                            <SelectItem key={e} value={e}>
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Início do Processo</Label>
                      <Input
                        type="date"
                        value={form.data_renovacao_inicio}
                        onChange={(e) =>
                          setForm({ ...form, data_renovacao_inicio: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Documentos Pendentes</Label>
                    <textarea
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                      value={form.documentos_pendentes}
                      onChange={(e) => setForm({ ...form, documentos_pendentes: e.target.value })}
                      placeholder="Liste os documentos ou informações pendentes do cliente..."
                    />
                  </div>
                </div>
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

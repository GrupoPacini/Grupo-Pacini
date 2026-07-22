import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Search,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { License, getLicenses } from '@/services/licenses'
import { RenewalEditDialog } from '@/components/RenewalEditDialog'
import { RenewalCompleteDialog } from '@/components/RenewalCompleteDialog'
import { getDaysRemaining, statusOperacionalBadge, etapaRenovacaoBadge } from '@/lib/license-utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function Renewals() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLicenses(await getLicenses())
    } catch {
      toast.error('Erro Ao Carregar Renovações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('licenses', () => loadData())

  const renewalLicenses = useMemo(
    () =>
      licenses.filter(
        (l) =>
          l.status === 'Renovando' || l.status === 'Vencido' || l.status_operacional === 'Vencida',
      ),
    [licenses],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return renewalLicenses.filter((l) => {
      const clientName = (l.expand?.client?.name || '').toLowerCase()
      const clientCnpj = l.expand?.client?.cnpj || ''
      const licenseName = (l.name || '').toLowerCase()
      return clientName.includes(q) || clientCnpj.includes(q) || licenseName.includes(q)
    })
  }, [renewalLicenses, search])

  const counts = useMemo(() => {
    const vencidas = renewalLicenses.filter(
      (l) => l.status === 'Vencido' || l.status_operacional === 'Vencida',
    ).length
    const emRenovacao = renewalLicenses.filter((l) => l.status === 'Renovando').length
    const pendentes = renewalLicenses.filter((l) => l.status_operacional === 'Pendente').length
    return { vencidas, emRenovacao, pendentes, total: renewalLicenses.length }
  }, [renewalLicenses])

  const openEdit = (license: License) => {
    setSelectedLicense(license)
    setEditOpen(true)
  }

  const openComplete = (license: License) => {
    setSelectedLicense(license)
    setCompleteOpen(true)
  }

  const summaryCards = [
    {
      label: 'Vencidas',
      value: counts.vencidas,
      icon: XCircle,
      iconColor: 'text-destructive',
      bg: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      label: 'Em Renovação',
      value: counts.emRenovacao,
      icon: RefreshCw,
      iconColor: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      label: 'Pendentes',
      value: counts.pendentes,
      icon: Clock,
      iconColor: 'text-yellow-600',
      bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      label: 'Total em Renovação',
      value: counts.total,
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/20',
    },
  ]

  const renderExpiration = (l: License) => {
    if (l.sem_vencimento)
      return <span className="text-muted-foreground font-medium text-sm">Indeterminado</span>
    if (!l.expiration_date) return <span className="text-muted-foreground text-sm">—</span>
    const days = getDaysRemaining(l.expiration_date)
    const expired = days !== null && days < 0
    return (
      <div className="flex flex-col">
        <span className={cn('text-sm', expired && 'text-destructive font-semibold')}>
          {format(new Date(l.expiration_date), 'dd/MM/yyyy')}
        </span>
        {days !== null && (
          <span
            className={cn(
              'text-xs font-medium',
              days < 0 ? 'text-destructive' : days <= 30 ? 'text-amber-600' : 'text-green-600',
            )}
          >
            {days < 0 ? `Vencida há ${Math.abs(days)} dias` : `${days} dias`}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw size={18} className="text-blue-600" />
          <span className="text-sm">Gestão de renovações e licenças vencidas</span>
        </div>
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
      </Card>

      <Card className="border-t-4 border-t-accent overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-title-case">Controle de Renovações</CardTitle>
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
              Nenhuma renovação pendente.
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
                    <TableHead className="font-semibold text-muted-foreground">Etapa</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Início</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Obs.</TableHead>
                    <TableHead className="text-right font-semibold text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const hasPendingDocs = !!l.documentos_pendentes?.trim()
                    const isConcluida = l.etapa_renovacao === 'Concluída'
                    return (
                      <TableRow key={l.id}>
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
                          {l.data_renovacao_inicio ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(l.data_renovacao_inicio), 'dd/MM/yyyy')}
                            </span>
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
                                  <p className="text-xs font-semibold mb-1">Observações:</p>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEdit(l)}
                            >
                              <Pencil size={16} />
                            </Button>
                            {!isConcluida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                onClick={() => openComplete(l)}
                              >
                                <CheckCircle2 size={16} />
                                <span className="hidden sm:inline">Concluir</span>
                              </Button>
                            )}
                          </div>
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

      <RenewalEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        license={selectedLicense}
        onSuccess={loadData}
      />
      <RenewalCompleteDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        license={selectedLicense}
        onSuccess={loadData}
      />
    </div>
  )
}

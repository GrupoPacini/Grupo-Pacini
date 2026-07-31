import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Client,
  getClient,
  getProcessesByClient,
  getLicensesByClient,
  Process,
} from '@/services/api'
import { getSocios, Socio } from '@/services/socios'
import { getClientCnaes, ClientCnae } from '@/services/client-cnaes'
import { getClientResponsibles, ClientResponsible } from '@/services/client-responsibles'
import { License } from '@/services/licenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Building2, FileText, ShieldCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'
import { VisaoGeralTab } from '@/components/Clientes/VisaoGeralTab'
import { DadosCadastraisTab } from '@/components/Clientes/DadosCadastraisTab'
import { SociosTab } from '@/components/Clientes/SociosTab'
import { CnaesTab } from '@/components/Clientes/CnaesTab'
import { ResponsaveisTab } from '@/components/Clientes/ResponsaveisTab'
import { ObservacoesTab } from '@/components/Clientes/ObservacoesTab'
import { TimelineTab } from '@/components/Clientes/TimelineTab'
import { QuickInfoSidebar } from '@/components/Clientes/QuickInfoSidebar'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value || '—'}</span>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can, canView } = usePermissions()
  const canEdit = can('Clientes', 'editar')
  const [client, setClient] = useState<Client | null>(null)
  const [processes, setProcesses] = useState<Process[]>([])
  const [licenses, setLicenses] = useState<License[]>([])
  const [responsibles, setResponsibles] = useState<ClientResponsible[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [cnaes, setCnaes] = useState<ClientCnae[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const c = await getClient(id)
      setClient(c)
      const [p, l, r, s, cn] = await Promise.all([
        getProcessesByClient(id).catch(() => []),
        getLicensesByClient(id).catch(() => []),
        getClientResponsibles(id).catch(() => []),
        getSocios(id).catch(() => []),
        getClientCnaes(id).catch(() => []),
      ])
      setProcesses(p)
      setLicenses(l as License[])
      setResponsibles(r)
      setSocios(s)
      setCnaes(cn)
    } catch {
      toast.error('Erro ao carregar cliente')
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  if (!client) return null
  const displayName = client.razao_social || client.name

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{client.cnpj || 'Sem CNPJ'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
              <TabsTrigger value="socios">Sócios</TabsTrigger>
              <TabsTrigger value="cnaes">CNAEs</TabsTrigger>
              <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
              {canView('Processos') && <TabsTrigger value="processos">Processos</TabsTrigger>}
              {canView('Licenças') && <TabsTrigger value="licencas">Licenças</TabsTrigger>}
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <VisaoGeralTab
                client={client}
                processes={processes}
                licenses={licenses}
                responsibles={responsibles}
                socios={socios}
                cnaes={cnaes}
                clientId={client.id}
              />
            </TabsContent>
            <TabsContent value="timeline">
              <TimelineTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="dados">
              <DadosCadastraisTab client={client} canEdit={canEdit} onSuccess={load} />
            </TabsContent>
            <TabsContent value="socios">
              <SociosTab clientId={client.id} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="cnaes">
              <CnaesTab clientId={client.id} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="responsaveis">
              <ResponsaveisTab clientId={client.id} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="observacoes">
              <ObservacoesTab client={client} canEdit={canEdit} onSuccess={load} />
            </TabsContent>

            {canView('Processos') && (
              <TabsContent value="processos">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Processos Vinculados</CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/processos?clientId=${client.id}`}>Ver Todos</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {processes.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Nenhum processo vinculado.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {processes.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-muted-foreground" />
                              <span className="text-sm font-medium">{p.title}</span>
                            </div>
                            <Badge variant="outline">{p.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {canView('Licenças') && (
              <TabsContent value="licencas">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Licenças Vinculadas</CardTitle>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/licencas?clientId=${client.id}`}>Ver Todas</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {licenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Nenhuma licença vinculada.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {licenses.map((l) => (
                          <div
                            key={l.id}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-muted-foreground" />
                              <span className="text-sm font-medium">{l.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {l.expiration_date && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(l.expiration_date), 'dd/MM/yyyy')}
                                </span>
                              )}
                              {l.status && <Badge variant="outline">{l.status}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="historico">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoRow
                    label="Criado em"
                    value={
                      client.created
                        ? format(new Date(client.created), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Última atualização"
                    value={
                      client.updated
                        ? format(new Date(client.updated), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : '—'
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:w-80 shrink-0">
          <QuickInfoSidebar
            client={client}
            responsibles={responsibles}
            canEdit={canEdit}
            canView={canView}
            onNavigate={setActiveTab}
          />
        </div>
      </div>
    </div>
  )
}

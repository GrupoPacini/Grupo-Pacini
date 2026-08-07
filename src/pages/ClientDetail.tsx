import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Client, getClient } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Pencil, FileText, ShieldCheck, RefreshCw, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCnpj } from '@/lib/client-utils'
import { DadosCadastraisTab } from '@/components/Clientes/DadosCadastraisTab'
import { SociosTab } from '@/components/Clientes/SociosTab'
import { CnaesTab } from '@/components/Clientes/CnaesTab'
import { TimelineTab } from '@/components/Clientes/TimelineTab'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can, canView } = usePermissions()
  const canEdit = can('Clientes', 'editar')
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dados')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const c = await getClient(id)
      setClient(c)
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
  const statusClass =
    client.client_status === 'Ativo'
      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400'
      : client.client_status === 'Inativo'
        ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400'
        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/clientes')}>
          <ArrowLeft size={16} className="mr-2" /> Voltar para Clientes
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground truncate">
                {client.nome_fantasia || 'Não informado'}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button variant="default" size="sm" asChild className="shrink-0">
              <Link to={`/clientes/${client.id}/editar`}>
                <Pencil size={16} className="mr-2" /> Editar Cliente
              </Link>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Código Interno:</span>
            <span className="text-sm font-medium text-foreground">
              {client.code || 'Não informado'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">CNPJ:</span>
            <span className="text-sm font-medium text-foreground">
              {client.cnpj ? formatCnpj(client.cnpj) : 'Não informado'}
            </span>
          </div>
          <Badge variant="outline" className={statusClass}>
            {client.client_status || 'Não informado'}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {canView('Processos') && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/processos?clientId=${client.id}`}>
              <FileText size={16} className="mr-2" /> Ver Processos
            </Link>
          </Button>
        )}
        {canView('Licenças') && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/licencas?clientId=${client.id}`}>
              <ShieldCheck size={16} className="mr-2" /> Ver Licenças
            </Link>
          </Button>
        )}
        {canView('Renovações') && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/renovacoes?clientId=${client.id}`}>
              <RefreshCw size={16} className="mr-2" /> Ver Renovações
            </Link>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="socios">Sócios</TabsTrigger>
          <TabsTrigger value="cnaes">CNAEs</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <DadosCadastraisTab client={client} />
        </TabsContent>
        <TabsContent value="socios">
          <SociosTab clientId={client.id} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="cnaes">
          <CnaesTab clientId={client.id} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="historico">
          <TimelineTab clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

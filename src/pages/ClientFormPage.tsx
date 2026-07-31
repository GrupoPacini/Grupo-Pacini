import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { ClientForm } from '@/components/Clientes/ClientForm'
import { usePermissions } from '@/hooks/use-permissions'
import { getClientById } from '@/services/clients'
import { formatCnpj, type ClientRecord } from '@/lib/client-utils'

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can, canView, loading } = usePermissions()
  const mode = id ? 'edit' : 'create'
  const [client, setClient] = useState<ClientRecord | null>(null)
  const [clientLoading, setClientLoading] = useState(mode === 'edit')

  useEffect(() => {
    if (mode === 'edit' && id) {
      getClientById(id)
        .then((c) => {
          setClient(c)
          setClientLoading(false)
        })
        .catch(() => {
          navigate('/clientes')
          setClientLoading(false)
        })
    }
  }, [mode, id, navigate])

  if (loading || clientLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const canAccess =
    mode === 'create' ? can('Clientes', 'criar') && canView('Clientes') : can('Clientes', 'editar')
  if (!canAccess) return <Navigate to="/access-denied" replace />

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          {mode === 'edit' && client ? (
            <>
              <p className="text-sm font-medium text-foreground">
                {client.razao_social || client.name}
              </p>
              <p className="text-sm text-muted-foreground font-mono">{formatCnpj(client.cnpj)}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {mode === 'edit'
                ? 'Atualize os dados cadastrais do cliente'
                : 'Cadastre uma nova empresa no sistema'}
            </p>
          )}
        </div>
      </div>

      <ClientForm
        mode={mode}
        clientId={id}
        initialClient={client}
        onSuccess={(clientId) => navigate(`/clientes/${clientId}`)}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}

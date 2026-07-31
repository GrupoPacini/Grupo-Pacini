import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { ClientForm } from '@/components/Clientes/ClientForm'
import { usePermissions } from '@/hooks/use-permissions'
import { Navigate } from 'react-router-dom'

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { can, loading } = usePermissions()
  const mode = id ? 'edit' : 'create'

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const canAccess = mode === 'create' ? can('Clientes', 'criar') : can('Clientes', 'editar')
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
          <p className="text-sm text-muted-foreground">
            {mode === 'edit'
              ? 'Atualize os dados cadastrais do cliente'
              : 'Cadastre uma nova empresa no sistema'}
          </p>
        </div>
      </div>

      <ClientForm
        mode={mode}
        clientId={id}
        onSuccess={(clientId) => navigate(`/clientes/${clientId}`)}
        onCancel={() => navigate(-1)}
      />
    </div>
  )
}

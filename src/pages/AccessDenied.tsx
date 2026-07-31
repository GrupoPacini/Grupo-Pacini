import { Link } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'

export default function AccessDenied() {
  const { canView } = usePermissions()
  const fallbackPath = canView('Dashboard') ? '/' : '/login'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="text-destructive" size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
        <Button asChild>
          <Link to={fallbackPath} className="gap-2">
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </Button>
      </div>
    </div>
  )
}

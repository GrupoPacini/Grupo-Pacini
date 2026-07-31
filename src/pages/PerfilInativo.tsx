import { ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

export default function PerfilInativo() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <ShieldAlert className="text-amber-600" size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Perfil Inativo</h1>
          <p className="text-muted-foreground">
            Seu perfil de acesso está inativo ou sem permissões. Entre em contato com o
            administrador.
          </p>
        </div>
        <Button onClick={signOut} variant="outline" className="gap-2">
          <LogOut size={16} />
          Sair
        </Button>
      </div>
    </div>
  )
}

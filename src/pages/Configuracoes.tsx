import { Navigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { SettingsCards } from '@/components/Configuracoes/SettingsCards'

export default function Configuracoes() {
  const { isAdmin, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-primary font-medium">Carregando...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings size={18} className="text-primary" />
          <span className="text-sm">Configurações do sistema e controle de acesso</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Gerencie usuários, perfis e permissões da plataforma.
        </p>
      </div>

      <SettingsCards isAdmin={isAdmin} />
    </div>
  )
}

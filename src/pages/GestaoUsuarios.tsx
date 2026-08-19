import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Settings, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, type UserRecord } from '@/services/users'
import { getDepartments, type DepartmentRecord } from '@/services/departments'
import { getActiveAccessProfiles, type AccessProfileRecord } from '@/services/access-profiles'
import { toast } from 'sonner'
import { UserManagement } from '@/components/Configuracoes/UserManagement'

export default function GestaoUsuarios() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [profiles, setProfiles] = useState<AccessProfileRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [u, d, p] = await Promise.all([getUsers(), getDepartments(), getActiveAccessProfiles()])
      setUsers(u)
      setDepartments(d)
      setProfiles(p)
    } catch {
      toast.error('Erro Ao Carregar Dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('users', () => loadData())

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-primary font-medium">Carregando...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/configuracoes" replace />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <Link
          to="/configuracoes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Configurações</span>
        </Link>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Settings size={18} className="text-primary" />
          <span className="text-sm">Gestão de Usuários</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Cadastre usuários, altere perfis, status e permissões de acesso.
        </p>
      </div>

      <UserManagement
        users={users}
        departments={departments}
        profiles={profiles}
        currentUserId={user?.id || ''}
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  )
}

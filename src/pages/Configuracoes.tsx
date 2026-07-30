import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, type UserRecord } from '@/services/users'
import { getDepartments, type DepartmentRecord } from '@/services/departments'
import { toast } from 'sonner'
import { StatsCards } from '@/components/Configuracoes/StatsCards'
import { PermissionCards } from '@/components/Configuracoes/PermissionCards'
import { UserManagement } from '@/components/Configuracoes/UserManagement'
import { PermissionsModal } from '@/components/Configuracoes/PermissionsModal'

export default function Configuracoes() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionsRole, setPermissionsRole] = useState<'admin' | 'colaborador' | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([getUsers(), getDepartments()])
      setUsers(u)
      setDepartments(d)
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

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === 'admin').length
    const colaboradores = users.filter((u) => u.role === 'colaborador').length
    const total = users.length
    return { total, admins, colaboradores, ativos: total }
  }, [users])

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

      <StatsCards
        total={stats.total}
        admins={stats.admins}
        colaboradores={stats.colaboradores}
        ativos={stats.ativos}
      />

      <PermissionCards
        adminCount={stats.admins}
        colaboradorCount={stats.colaboradores}
        onViewPermissions={setPermissionsRole}
      />

      <UserManagement
        users={users}
        departments={departments}
        loading={loading}
        onRefresh={loadData}
      />

      <PermissionsModal
        open={permissionsRole !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionsRole(null)
        }}
        role={permissionsRole}
      />
    </div>
  )
}

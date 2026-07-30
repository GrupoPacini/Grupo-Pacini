import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Settings } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, updateUserRole, type UserRecord } from '@/services/users'
import { toast } from 'sonner'
import { StatsCards } from '@/components/Configuracoes/StatsCards'
import { PermissionCards } from '@/components/Configuracoes/PermissionCards'
import { UserManagement } from '@/components/Configuracoes/UserManagement'
import { NewUserModal } from '@/components/Configuracoes/NewUserModal'
import { PermissionsModal } from '@/components/Configuracoes/PermissionsModal'

export default function Configuracoes() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [newUserOpen, setNewUserOpen] = useState(false)
  const [permissionsRole, setPermissionsRole] = useState<'admin' | 'colaborador' | null>(null)
  const { isAdmin } = useAuth()

  const loadData = useCallback(async () => {
    try {
      setUsers(await getUsers())
    } catch {
      toast.error('Erro Ao Carregar Usuários')
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

  const handleRoleChange = async (userId: string, role: 'admin' | 'colaborador') => {
    setUpdatingId(userId)
    try {
      await updateUserRole(userId, role)
      toast.success('Função Do Usuário Atualizada')
      loadData()
    } catch {
      toast.error('Erro Ao Atualizar Função')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleViewPermissions = (role: 'admin' | 'colaborador') => {
    setPermissionsRole(role)
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
        onViewPermissions={handleViewPermissions}
      />

      {isAdmin ? (
        <UserManagement
          users={users}
          loading={loading}
          updatingId={updatingId}
          onRoleChange={handleRoleChange}
          onNewUser={() => setNewUserOpen(true)}
        />
      ) : (
        !loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <ShieldCheck size={16} className="text-primary" />
            Apenas administradores podem gerenciar usuários.
          </div>
        )
      )}

      <NewUserModal open={newUserOpen} onOpenChange={setNewUserOpen} onSuccess={loadData} />

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

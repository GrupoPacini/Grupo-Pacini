import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import type { UserRecord } from '@/services/users'
import type { DepartmentRecord } from '@/services/departments'
import { UserFilters } from './UserFilters'
import { UserTable, type UserAction } from './UserTable'
import { ViewUserModal } from './ViewUserModal'
import { EditUserModal } from './EditUserModal'
import { RoleChangeModal } from './RoleChangeModal'
import { StatusChangeModal } from './StatusChangeModal'
import { ResetPasswordModal } from './ResetPasswordModal'
import { DeactivateUserModal } from './DeactivateUserModal'
import { NewUserModal } from './NewUserModal'

interface UserManagementProps {
  users: UserRecord[]
  departments: DepartmentRecord[]
  loading: boolean
  onRefresh: () => void
}

export function UserManagement({ users, departments, loading, onRefresh }: UserManagementProps) {
  const [search, setSearch] = useState('')
  const [profileFilter, setProfileFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [activeUser, setActiveUser] = useState<UserRecord | null>(null)
  const [activeAction, setActiveAction] = useState<UserAction | null>(null)
  const [newUserOpen, setNewUserOpen] = useState(false)

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return users.filter((u) => {
      const matchSearch =
        !s || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
      const matchProfile = profileFilter === 'all' || u.role === profileFilter
      const matchStatus = statusFilter === 'all' || (u.status || 'Ativo') === statusFilter
      const matchDept = deptFilter === 'all' || u.department === deptFilter
      return matchSearch && matchProfile && matchStatus && matchDept
    })
  }, [users, search, profileFilter, statusFilter, deptFilter])

  const hasFilters =
    !!search || profileFilter !== 'all' || statusFilter !== 'all' || deptFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setProfileFilter('all')
    setStatusFilter('all')
    setDeptFilter('all')
  }

  const handleAction = (action: UserAction, user: UserRecord) => {
    setActiveUser(user)
    setActiveAction(action)
  }

  const closeModal = () => {
    setActiveUser(null)
    setActiveAction(null)
  }

  const getActiveUser = (a: UserAction) => (activeAction === a ? activeUser : null)

  return (
    <Card className="border-t-4 border-t-primary shadow-sm">
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={18} />
              Gerenciamento de Usuários
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 mt-1">
              Gerencie usuários, perfis e permissões da plataforma.
            </CardDescription>
          </div>
          <Button
            onClick={() => setNewUserOpen(true)}
            size="sm"
            variant="secondary"
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <UserPlus size={16} />
            Novo usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <UserFilters
          search={search}
          onSearchChange={setSearch}
          profileFilter={profileFilter}
          onProfileFilterChange={setProfileFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          departmentFilter={deptFilter}
          onDepartmentFilterChange={setDeptFilter}
          departments={departments}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />
        <UserTable users={filtered} loading={loading} onAction={handleAction} />
        <ViewUserModal user={getActiveUser('view')} onClose={closeModal} />
        <EditUserModal
          user={getActiveUser('edit')}
          departments={departments}
          onClose={closeModal}
          onSuccess={onRefresh}
        />
        <RoleChangeModal user={getActiveUser('role')} onClose={closeModal} onSuccess={onRefresh} />
        <StatusChangeModal
          user={getActiveUser('status')}
          onClose={closeModal}
          onSuccess={onRefresh}
        />
        <ResetPasswordModal user={getActiveUser('resetPassword')} onClose={closeModal} />
        <DeactivateUserModal
          user={getActiveUser('deactivate')}
          onClose={closeModal}
          onSuccess={onRefresh}
        />
        <NewUserModal
          open={newUserOpen}
          onOpenChange={setNewUserOpen}
          onSuccess={onRefresh}
          departments={departments}
        />
      </CardContent>
    </Card>
  )
}

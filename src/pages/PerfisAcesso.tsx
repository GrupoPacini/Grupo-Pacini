import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { KeyRound, ArrowLeft, Plus } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { ProfileCards } from '@/components/Configuracoes/ProfileCards'
import { ProfilePermissionsModal } from '@/components/Configuracoes/ProfilePermissionsModal'
import { ProfileFormModal } from '@/components/Configuracoes/ProfileFormModal'
import { ProfilePermissionsConfigModal } from '@/components/Configuracoes/ProfilePermissionsConfigModal'
import { getAccessProfiles, type AccessProfileRecord } from '@/services/access-profiles'

export default function PerfisAcesso() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<AccessProfileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionsRole, setPermissionsRole] = useState<'admin' | 'colaborador' | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AccessProfileRecord | null>(null)
  const [configProfile, setConfigProfile] = useState<AccessProfileRecord | null>(null)

  const loadData = useCallback(async () => {
    try {
      const data = await getAccessProfiles()
      setProfiles(data)
    } catch {
      toast.error('Erro ao carregar perfis')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('access_profiles', () => loadData())

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

  const handleNewProfile = () => {
    setEditingProfile(null)
    setFormOpen(true)
  }

  const handleEditProfile = (profile: AccessProfileRecord) => {
    setEditingProfile(profile)
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    if (!open) {
      setFormOpen(false)
      setEditingProfile(null)
    }
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <KeyRound size={18} className="text-primary" />
              <span className="text-sm">Perfis de Acesso</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Consulte os perfis existentes e as permissões concedidas a cada um.
            </p>
          </div>
          <button
            onClick={handleNewProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo perfil
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl border border-border bg-muted/20 animate-pulse" />
          <div className="h-48 rounded-xl border border-border bg-muted/20 animate-pulse" />
        </div>
      ) : (
        <ProfileCards
          profiles={profiles}
          onViewPermissions={setPermissionsRole}
          onEditProfile={handleEditProfile}
          onConfigPermissions={setConfigProfile}
        />
      )}

      <ProfilePermissionsModal
        open={permissionsRole !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionsRole(null)
        }}
        role={permissionsRole}
      />

      <ProfileFormModal
        open={formOpen}
        onOpenChange={handleFormClose}
        profile={editingProfile}
        onSuccess={loadData}
        existingNames={profiles.map((p) => p.name)}
      />

      <ProfilePermissionsConfigModal
        open={configProfile !== null}
        onOpenChange={(open) => {
          if (!open) setConfigProfile(null)
        }}
        profile={configProfile}
        onSuccess={loadData}
      />
    </div>
  )
}

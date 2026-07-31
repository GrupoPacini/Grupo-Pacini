import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import { updateUserProfile, type UserRecord } from '@/services/users'
import type { AccessProfileRecord } from '@/services/access-profiles'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface RoleChangeModalProps {
  user: UserRecord | null
  profiles: AccessProfileRecord[]
  onClose: () => void
  onSuccess: () => void
}

export function RoleChangeModal({ user, profiles, onClose, onSuccess }: RoleChangeModalProps) {
  const [newProfile, setNewProfile] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const currentProfile = user?.expand?.access_profile
  const isCurrentInactive = currentProfile && currentProfile.status !== 'active'

  const availableProfiles = useMemo(() => {
    const result = [...profiles]
    if (currentProfile && currentProfile.status !== 'active') {
      if (!result.find((p) => p.id === currentProfile.id)) {
        result.unshift(currentProfile)
      }
    }
    return result
  }, [profiles, currentProfile])

  useEffect(() => {
    if (user) {
      const current = user.expand?.access_profile
      if (current && current.status === 'active') {
        setNewProfile(current.id)
      } else if (profiles.length > 0) {
        setNewProfile(profiles[0].id)
      } else {
        setNewProfile('')
      }
    }
  }, [user, profiles])

  const handleConfirm = async () => {
    if (!user || !newProfile) return
    if (newProfile === (user.access_profile || '')) {
      toast.error('Selecione um perfil diferente do atual.')
      return
    }
    const selected = availableProfiles.find((p) => p.id === newProfile)
    if (selected && selected.status !== 'active') {
      toast.error('Não é possível vincular a um perfil inativo.')
      return
    }
    setLoading(true)
    try {
      await updateUserProfile(user.id, newProfile)
      toast.success('Perfil atualizado com sucesso.')
      onClose()
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const currentProfileName = currentProfile?.name || '—'
  const userName = user?.name || user?.email || 'usuário'
  const hasChanged = newProfile && newProfile !== (user?.access_profile || '')

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Perfil de Acesso</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja alterar o perfil de <strong>{userName}</strong>? Esta ação pode
            afetar as permissões do usuário.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Perfil atual:</span>
            <span className="font-medium">{currentProfileName}</span>
          </div>
          {isCurrentInactive && (
            <div className="flex items-center gap-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2">
              <AlertTriangle size={14} className="text-orange-600 shrink-0" />
              <span className="text-xs text-orange-700">
                O perfil atual está inativo. Selecione um perfil ativo para continuar.
              </span>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo perfil</label>
            <Select value={newProfile} onValueChange={setNewProfile}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {availableProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.status !== 'active' ? ' (Inativo)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !hasChanged}
            className="gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

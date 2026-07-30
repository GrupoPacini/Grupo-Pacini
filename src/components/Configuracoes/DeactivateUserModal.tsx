import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, UserX } from 'lucide-react'
import { updateUserStatus, type UserRecord } from '@/services/users'
import { toast } from 'sonner'

interface DeactivateUserModalProps {
  user: UserRecord | null
  onClose: () => void
  onSuccess: () => void
}

export function DeactivateUserModal({ user, onClose, onSuccess }: DeactivateUserModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateUserStatus(user.id, 'Inativo')
      toast.success('Usuário desativado')
      onClose()
      onSuccess()
    } catch {
      toast.error('Erro ao desativar usuário')
    } finally {
      setLoading(false)
    }
  }

  const userName = user?.name || user?.email || 'usuário'

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <UserX size={18} />
            Desativar Usuário
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desativar o usuário <strong>{userName}</strong>? O usuário não
            poderá mais acessar a plataforma.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Desativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

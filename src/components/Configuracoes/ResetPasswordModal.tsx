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
import { Loader2, Mail } from 'lucide-react'
import { requestPasswordReset, type UserRecord } from '@/services/users'
import { toast } from 'sonner'

interface ResetPasswordModalProps {
  user: UserRecord | null
  onClose: () => void
}

export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!user) return
    setLoading(true)
    try {
      await requestPasswordReset(user.email)
      toast.success('E-mail de redefinição de senha enviado')
      onClose()
    } catch {
      toast.error('Redefinição de senha requer SMTP configurado.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const userName = user?.name || user?.email || 'usuário'

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={18} className="text-primary" />
            Redefinir Senha
          </DialogTitle>
          <DialogDescription>
            Um e-mail de redefinição de senha será enviado para <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading} className="gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Enviar e-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

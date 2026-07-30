import { useState, useEffect } from 'react'
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
import { Loader2 } from 'lucide-react'
import { updateUserStatus, type UserRecord } from '@/services/users'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['Ativo', 'Inativo', 'Bloqueado', 'Convite pendente']

interface StatusChangeModalProps {
  user: UserRecord | null
  onClose: () => void
  onSuccess: () => void
}

export function StatusChangeModal({ user, onClose, onSuccess }: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState<string>('Ativo')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) setNewStatus(user.status || 'Ativo')
  }, [user])

  const handleConfirm = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateUserStatus(user.id, newStatus)
      toast.success('Status do usuário atualizado')
      onClose()
      onSuccess()
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const userName = user?.name || user?.email || 'usuário'
  const currentStatus = user?.status || 'Ativo'

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Status</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja alterar o status de <strong>{userName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Status atual:</span>
            <span className="font-medium">{currentStatus}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
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
          <Button type="button" onClick={handleConfirm} disabled={loading} className="gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
import { updateUserRole, type UserRecord } from '@/services/users'
import { toast } from 'sonner'

interface RoleChangeModalProps {
  user: UserRecord | null
  onClose: () => void
  onSuccess: () => void
}

export function RoleChangeModal({ user, onClose, onSuccess }: RoleChangeModalProps) {
  const [newRole, setNewRole] = useState<string>('colaborador')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) setNewRole(user.role === 'admin' ? 'colaborador' : 'admin')
  }, [user])

  const handleConfirm = async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateUserRole(user.id, newRole as 'admin' | 'colaborador')
      toast.success('Perfil do usuário atualizado')
      onClose()
      onSuccess()
    } catch {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const currentRole = user?.role === 'admin' ? 'Administrador' : 'Colaborador'
  const userName = user?.name || user?.email || 'usuário'

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Perfil</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja alterar o perfil de <strong>{userName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Perfil atual:</span>
            <span className="font-medium">{currentRole}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Novo perfil</label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="colaborador">Colaborador</SelectItem>
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

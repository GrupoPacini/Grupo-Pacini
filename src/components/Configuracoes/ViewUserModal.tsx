import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UserRecord } from '@/services/users'

interface ViewUserModalProps {
  user: UserRecord | null
  onClose: () => void
}

export function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  const deptName = user?.expand?.department?.name || '—'
  const lastAccess = user?.last_access
    ? format(new Date(user.last_access), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    : 'Nunca'
  const created = user?.created
    ? format(new Date(user.created), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    : '—'

  const fields = [
    { label: 'Nome', value: user?.name || '—' },
    { label: 'E-mail', value: user?.email || '—' },
    { label: 'Departamento', value: deptName },
    {
      label: 'Perfil',
      value:
        user?.expand?.access_profile?.name ||
        (user?.role === 'admin'
          ? 'Administrador'
          : user?.role === 'Cliente'
            ? 'Cliente'
            : 'Colaborador'),
    },
    {
      label: 'Empresa Vinculada',
      value: user?.expand?.client
        ? user.expand.client.razao_social || user.expand.client.name
        : '—',
    },
    { label: 'Status', value: user?.status || 'Ativo' },
    { label: 'Último acesso', value: lastAccess },
    { label: 'Criado em', value: created },
  ]

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
          <DialogDescription>Informações completas do usuário.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex justify-between items-center py-2 border-b border-border/50 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{f.label}</span>
              <span className="text-sm font-medium text-foreground">{f.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

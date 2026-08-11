import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, ShieldCheck, ToggleLeft, KeyRound, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UserRecord } from '@/services/users'

export type UserAction = 'view' | 'edit' | 'profile' | 'status' | 'resetPassword' | 'deactivate'

interface UserTableProps {
  users: UserRecord[]
  loading: boolean
  onAction: (action: UserAction, user: UserRecord) => void
  currentUserId: string
}

const STATUS_STYLES: Record<string, string> = {
  Ativo: 'bg-green-500/15 text-green-700 border-green-500/30',
  Inativo: 'bg-red-500/15 text-red-700 border-red-500/30',
  Bloqueado: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  'Convite pendente': 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
}

export function UserTable({ users, loading, onAction, currentUserId }: UserTableProps) {
  const baseUrl = import.meta.env.VITE_POCKETBASE_URL

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">Nenhum usuário encontrado.</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Usuário</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Perfil de Acesso</TableHead>
            <TableHead>Empresa Vinculada</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead className="text-right pr-6">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const status = u.status || 'Ativo'
            const isCliente = u.expand?.access_profile?.name === 'Cliente'
            const deptName = !isCliente ? u.expand?.department?.name || '—' : '—'
            const profileName = u.expand?.access_profile?.name || '—'
            const clientName = isCliente
              ? u.expand?.client?.razao_social || u.expand?.client?.name || '—'
              : '—'
            const lastAccess = u.last_access
              ? format(new Date(u.last_access), 'dd/MM/yyyy HH:mm', { locale: ptBR })
              : 'Nunca'
            const avatarUrl = u.avatar ? `${baseUrl}/api/files/users/${u.id}/${u.avatar}` : null
            const initials = (u.name || u.email || '?')[0]?.toUpperCase() || '?'
            const isSelf = u.id === currentUserId

            return (
              <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      {avatarUrl && <AvatarImage src={avatarUrl} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{u.name || '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm whitespace-nowrap">
                  {u.email || '—'}
                </TableCell>
                <TableCell className="py-4">
                  {profileName !== '—' ? (
                    <Badge
                      variant="outline"
                      className={
                        profileName === 'Administrador'
                          ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                          : profileName === 'Cliente'
                            ? 'bg-teal-500/15 text-teal-700 border-teal-500/30'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                      }
                    >
                      {profileName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm max-w-[200px] truncate">
                  {clientName}
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm">{deptName}</TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant="outline"
                    className={STATUS_STYLES[status] || STATUS_STYLES['Ativo']}
                  >
                    {status}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-muted-foreground text-sm whitespace-nowrap">
                  {lastAccess}
                </TableCell>
                <TableCell className="text-right py-4 pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAction('view', u)}>
                        <Eye size={14} className="mr-2" /> Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction('edit', u)}>
                        <Pencil size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction('profile', u)} disabled={isSelf}>
                        <ShieldCheck size={14} className="mr-2" /> Alterar perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction('status', u)}>
                        <ToggleLeft size={14} className="mr-2" /> Alterar status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onAction('resetPassword', u)}>
                        <KeyRound size={14} className="mr-2" /> Redefinir senha
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAction('deactivate', u)}
                        className="text-red-600 focus:text-red-600"
                        disabled={isSelf}
                      >
                        <UserX size={14} className="mr-2" /> Desativar usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

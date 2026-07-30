import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, UserPlus, Loader2 } from 'lucide-react'
import type { UserRecord } from '@/services/users'

interface UserManagementProps {
  users: UserRecord[]
  loading: boolean
  updatingId: string | null
  onRoleChange: (userId: string, role: 'admin' | 'colaborador') => void
  onNewUser: () => void
}

export function UserManagement({
  users,
  loading,
  updatingId,
  onRoleChange,
  onNewUser,
}: UserManagementProps) {
  return (
    <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-title-case">
            <Users size={18} />
            Gestão de Usuários
          </CardTitle>
          <Button
            onClick={onNewUser}
            size="sm"
            variant="secondary"
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <UserPlus size={16} />
            Novo usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground pl-6">Nome</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">E-mail</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">
                    Função Atual
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right pr-6">
                    Alterar Função
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {(u.name || u.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{u.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground text-sm">{u.email}</TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant={u.role === 'admin' ? 'default' : 'secondary'}
                        className={u.role === 'admin' ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {updatingId === u.id && (
                          <Loader2 size={14} className="animate-spin text-muted-foreground" />
                        )}
                        <Select
                          value={u.role || 'colaborador'}
                          onValueChange={(v) => onRoleChange(u.id, v as 'admin' | 'colaborador')}
                          disabled={updatingId === u.id}
                        >
                          <SelectTrigger className="w-[180px] ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="colaborador">Colaborador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

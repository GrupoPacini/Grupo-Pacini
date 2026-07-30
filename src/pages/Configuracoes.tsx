import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldCheck, Users, Check, X, Lock } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getUsers, updateUserRole, type UserRecord } from '@/services/users'
import { toast } from 'sonner'

interface PermissionRow {
  permission: string
  admin: boolean
  colaborador: boolean
}

const PERMISSION_MATRIX: PermissionRow[] = [
  { permission: 'Criar/editar/excluir clientes', admin: true, colaborador: false },
  { permission: 'Criar/alterar processos', admin: true, colaborador: false },
  { permission: 'Alterar licenças', admin: true, colaborador: false },
  { permission: 'Gerenciar usuários', admin: true, colaborador: false },
  { permission: 'Visualizar dados', admin: true, colaborador: true },
]

export default function Configuracoes() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { isAdmin } = useAuth()

  const loadData = useCallback(async () => {
    try {
      setUsers(await getUsers())
    } catch {
      toast.error('Erro Ao Carregar Usuários')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('users', () => loadData())

  const handleRoleChange = async (userId: string, role: 'admin' | 'colaborador') => {
    setUpdatingId(userId)
    try {
      await updateUserRole(userId, role)
      toast.success('Função Do Usuário Atualizada')
      loadData()
    } catch {
      toast.error('Erro Ao Atualizar Função')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ShieldCheck size={18} className="text-primary" />
        <span className="text-sm">Configurações do sistema e controle de acesso</span>
      </div>

      <Card className="border-t-4 border-t-accent">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="flex items-center gap-2 text-title-case">
            <Lock size={18} />
            Controle De Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-muted-foreground pl-6">
                    Permissão
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center">
                    Administrador
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-center pr-6">
                    Colaborador
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_MATRIX.map((row) => (
                  <TableRow key={row.permission} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 py-4 font-medium text-foreground">
                      {row.permission}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {row.admin ? (
                        <Check className="inline text-green-600" size={20} />
                      ) : (
                        <X className="inline text-red-500" size={20} />
                      )}
                    </TableCell>
                    <TableCell className="text-center py-4 pr-6">
                      {row.colaborador ? (
                        <Check className="inline text-green-600" size={20} />
                      ) : (
                        <X className="inline text-red-500" size={20} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="flex items-center gap-2 text-title-case">
              <Users size={18} />
              Gerenciamento De Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-muted-foreground pl-6">
                        Nome
                      </TableHead>
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
                        <TableCell className="py-4 text-muted-foreground text-sm">
                          {u.email}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant={u.role === 'admin' ? 'default' : 'secondary'}
                            className={
                              u.role === 'admin' ? 'bg-primary text-primary-foreground' : ''
                            }
                          >
                            {u.role === 'admin' ? 'Administrador' : 'Colaborador'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4 pr-6">
                          <Select
                            value={u.role || 'colaborador'}
                            onValueChange={(v) =>
                              handleRoleChange(u.id, v as 'admin' | 'colaborador')
                            }
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

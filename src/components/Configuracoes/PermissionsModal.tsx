import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Check, X } from 'lucide-react'

interface PermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: 'admin' | 'colaborador' | null
}

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

export function PermissionsModal({ open, onOpenChange, role }: PermissionsModalProps) {
  if (!role) return null
  const roleName = role === 'admin' ? 'Administrador' : 'Colaborador'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Permissões — {roleName}</DialogTitle>
          <DialogDescription>
            Lista de permissões associadas ao perfil de {roleName.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Permissão</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">
                  {roleName}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_MATRIX.map((row) => {
                const allowed = role === 'admin' ? row.admin : row.colaborador
                return (
                  <TableRow key={row.permission} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 font-medium text-foreground">
                      {row.permission}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      {allowed ? (
                        <Check className="inline text-green-600" size={18} />
                      ) : (
                        <X className="inline text-red-500" size={18} />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}

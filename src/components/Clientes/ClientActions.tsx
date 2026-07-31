import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Eye, Pencil, RefreshCw, FileText, ShieldCheck } from 'lucide-react'
import type { Client } from '@/services/api'

interface ClientActionsProps {
  client: Client
  onEdit: (client: Client) => void
  onStatusChange: (client: Client) => void
  canEdit: boolean
  canManage: boolean
}

export function ClientActions({
  client,
  onEdit,
  onStatusChange,
  canEdit,
  canManage,
}: ClientActionsProps) {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`/clientes/${client.id}`)}>
          <Eye size={14} className="mr-2" /> Visualizar
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit(client)}>
            <Pencil size={14} className="mr-2" /> Editar
          </DropdownMenuItem>
        )}
        {canManage && (
          <DropdownMenuItem onClick={() => onStatusChange(client)}>
            <RefreshCw size={14} className="mr-2" /> Alterar Status
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/processos?clientId=${client.id}`)}>
          <FileText size={14} className="mr-2" /> Ver Processos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/licencas?clientId=${client.id}`)}>
          <ShieldCheck size={14} className="mr-2" /> Ver Licenças
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

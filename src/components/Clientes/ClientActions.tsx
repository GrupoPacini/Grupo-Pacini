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
import type { ClientRecord } from '@/lib/client-utils'

interface ClientActionsProps {
  client: ClientRecord
  onStatusChange: (client: ClientRecord) => void
  canEdit: boolean
  canManage: boolean
}

export function ClientActions({ client, onStatusChange, canEdit, canManage }: ClientActionsProps) {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigate(`/clientes/${client.id}`)}>
          <Eye size={14} className="mr-2" /> Visualizar cliente
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={() => navigate(`/clientes/${client.id}/editar`)}>
            <Pencil size={14} className="mr-2" /> Editar dados cadastrais
          </DropdownMenuItem>
        )}
        {canManage && (
          <DropdownMenuItem onClick={() => onStatusChange(client)}>
            <RefreshCw size={14} className="mr-2" /> Alterar status
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(`/processos?clientId=${client.id}`)}>
          <FileText size={14} className="mr-2" /> Abrir processos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/licencas?clientId=${client.id}`)}>
          <ShieldCheck size={14} className="mr-2" /> Abrir licenças
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

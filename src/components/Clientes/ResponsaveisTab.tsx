import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  getClientResponsibles,
  deleteClientResponsible,
  ClientResponsible,
} from '@/services/client-responsibles'
import { ResponsibleFormDialog } from '@/components/Clientes/ResponsibleFormDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  clientId: string
  canEdit: boolean
}

export function ResponsaveisTab({ clientId, canEdit }: Props) {
  const [responsibles, setResponsibles] = useState<ClientResponsible[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClientResponsible | null>(null)

  const load = useCallback(async () => {
    try {
      setResponsibles(await getClientResponsibles(clientId))
    } catch {
      toast.error('Erro ao carregar responsáveis')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('client_responsibles', () => load())

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (r: ClientResponsible) => {
    setEditing(r)
    setDialogOpen(true)
  }
  const handleDelete = async (r: ClientResponsible) => {
    const name = r.expand?.user?.name || 'este responsável'
    if (!window.confirm(`Remover ${name}?`)) return
    try {
      await deleteClientResponsible(r.id)
      toast.success('Responsável removido')
      load()
    } catch {
      toast.error('Erro ao remover responsável')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Responsáveis</CardTitle>
          {canEdit && (
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus size={14} /> Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : responsibles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum responsável cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Observações</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsibles.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{r.expand?.user?.name || '—'}</TableCell>
                    <TableCell className="text-sm">{r.expand?.department?.name || '—'}</TableCell>
                    <TableCell className="text-sm">{r.role || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {r.observations || '—'}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(r)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <ResponsibleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        editingResponsible={editing}
        onSuccess={load}
      />
    </Card>
  )
}

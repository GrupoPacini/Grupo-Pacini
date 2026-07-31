import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getClientCnaes, deleteClientCnae, ClientCnae } from '@/services/client-cnaes'
import { CnaeFormDialog } from '@/components/Clientes/CnaeFormDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  clientId: string
  canEdit: boolean
}

export function CnaesTab({ clientId, canEdit }: Props) {
  const [cnaes, setCnaes] = useState<ClientCnae[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClientCnae | null>(null)

  const load = useCallback(async () => {
    try {
      setCnaes(await getClientCnaes(clientId))
    } catch {
      toast.error('Erro ao carregar CNAEs')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('client_cnaes', () => load())

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: ClientCnae) => {
    setEditing(c)
    setDialogOpen(true)
  }
  const handleDelete = async (c: ClientCnae) => {
    if (!window.confirm(`Remover CNAE "${c.code}"?`)) return
    try {
      await deleteClientCnae(c.id)
      toast.success('CNAE removido')
      load()
    } catch {
      toast.error('Erro ao remover CNAE')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>CNAEs</CardTitle>
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
        ) : cnaes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum CNAE cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cnaes.map((c) => (
                  <TableRow
                    key={c.id}
                    className={c.is_principal ? 'bg-primary/5' : 'hover:bg-muted/50'}
                  >
                    <TableCell className="font-mono font-medium">{c.code}</TableCell>
                    <TableCell className="text-sm">{c.description || '—'}</TableCell>
                    <TableCell>
                      {c.is_principal ? (
                        <Badge className="bg-primary/10 text-primary gap-1">
                          <Star size={10} /> Principal
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Secundário</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(c)}
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
      <CnaeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        editingCnae={editing}
        onSuccess={load}
      />
    </Card>
  )
}

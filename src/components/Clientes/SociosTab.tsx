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
import { getSocios, deleteSocio, Socio } from '@/services/socios'
import { SocioFormDialog } from '@/components/Clientes/SocioFormDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  clientId: string
  canEdit: boolean
}

export function SociosTab({ clientId, canEdit }: Props) {
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Socio | null>(null)

  const load = useCallback(async () => {
    try {
      setSocios(await getSocios(clientId))
    } catch {
      toast.error('Erro ao carregar sócios')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])
  useRealtime('socios', () => load())

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (s: Socio) => {
    setEditing(s)
    setDialogOpen(true)
  }
  const handleDelete = async (s: Socio) => {
    if (!window.confirm(`Remover sócio "${s.nome}"?`)) return
    try {
      await deleteSocio(s.id)
      toast.success('Sócio removido')
      load()
    } catch {
      toast.error('Erro ao remover sócio')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sócios</CardTitle>
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
        ) : socios.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum sócio cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Participação</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Admin</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {socios.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{s.cpf || '—'}</TableCell>
                    <TableCell>
                      {s.participacao_societaria != null ? `${s.participacao_societaria}%` : '—'}
                    </TableCell>
                    <TableCell>{s.cargo || '—'}</TableCell>
                    <TableCell className="text-sm">{s.email || '—'}</TableCell>
                    <TableCell className="text-sm">{s.telefone || '—'}</TableCell>
                    <TableCell>
                      {s.administrador ? (
                        <Badge className="bg-primary/10 text-primary">Sim</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Não</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(s)}
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
      <SocioFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        editingSocio={editing}
        onSuccess={load}
      />
    </Card>
  )
}

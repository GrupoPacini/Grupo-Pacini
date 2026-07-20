import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { Client, getClients } from '@/services/api'
import { License, getLicenses, createLicense } from '@/services/licenses'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'

const LICENSE_TYPES = ['Certificado Digital', 'Software', 'Alvará', 'Outros']
const emptyForm = { name: '', client: '', type: '', expiration_date: '', status: 'Ativo' }

export default function Licenses() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [l, c] = await Promise.all([getLicenses(), getClients()])
      setLicenses(l)
      setClients(c)
    } catch {
      toast.error('Erro Ao Carregar Licenças')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('licenses', () => loadData())

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.set('name', form.name)
      fd.set('client', form.client)
      fd.set('type', form.type)
      fd.set('expiration_date', form.expiration_date)
      fd.set('status', form.status)
      await createLicense(fd)
      toast.success('Licença Criada')
      setDialogOpen(false)
      setForm(emptyForm)
      loadData()
    } catch {
      toast.error('Erro Ao Criar Licença')
    } finally {
      setSubmitting(false)
    }
  }

  const isExpiringSoon = (date: string) => {
    const days = differenceInDays(new Date(date), new Date())
    return days >= 0 && days <= 30
  }
  const isExpired = (date: string) => differenceInDays(new Date(date), new Date()) < 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle size={18} className="text-destructive" />
          <span className="text-sm">Licenças em vermelho expiram em até 30 dias</span>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus size={16} /> Nova Licença
        </Button>
      </div>

      <Card className="border-t-4 border-t-accent overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-title-case">Controle De Licenças E Certificados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : licenses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhuma licença cadastrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground">Licença</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Cliente</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Tipo</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Validade</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((l) => {
                    const expiring = l.expiration_date && isExpiringSoon(l.expiration_date)
                    const expired = l.expiration_date && isExpired(l.expiration_date)
                    return (
                      <TableRow
                        key={l.id}
                        className={expiring || expired ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-muted-foreground" />
                            <span className="font-medium">{l.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.expand?.client?.name || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{l.type}</Badge>
                        </TableCell>
                        <TableCell
                          className={expiring || expired ? 'text-destructive font-medium' : ''}
                        >
                          {l.expiration_date
                            ? format(new Date(l.expiration_date), 'dd/MM/yyyy')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              l.status === 'Ativo'
                                ? 'default'
                                : l.status === 'Expirado'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {l.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-title-case">Nova Licença</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Certificado Digital A1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cliente</Label>
              <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <Select
                  value={form.type || '__none__'}
                  onValueChange={(v) => setForm({ ...form, type: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {LICENSE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Validade</Label>
                <Input
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) => setForm({ ...form, expiration_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Expirado">Expirado</SelectItem>
                  <SelectItem value="Renovando">Renovando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

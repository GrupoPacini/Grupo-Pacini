import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'
import { createUser } from '@/services/users'
import type { AccessProfileRecord } from '@/services/access-profiles'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import type { DepartmentRecord } from '@/services/departments'
import { getAllClientsForImport } from '@/services/clients'
import { ClientCombobox } from '@/components/ClientCombobox'
import { useUserForm, type UserType } from '@/hooks/use-user-form'

interface NewUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  departments: DepartmentRecord[]
  profiles: AccessProfileRecord[]
}

export function NewUserModal({
  open,
  onOpenChange,
  onSuccess,
  departments,
  profiles,
}: NewUserModalProps) {
  const {
    form,
    update,
    setUserType,
    reset,
    isCliente,
    showAccessProfile,
    showDepartment,
    showClient,
    validate,
    buildCreatePayload,
  } = useUserForm(undefined, profiles)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      getAllClientsForImport()
        .then(setClients)
        .catch(() => {})
    }
  }, [open])

  const handleClose = (open: boolean) => {
    if (!open) {
      reset()
      setFieldErrors({})
    }
    onOpenChange(open)
  }

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type)
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setLoading(true)
    setFieldErrors({})
    try {
      await createUser(buildCreatePayload())
      toast.success('Usuário criado com sucesso')
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={18} className="text-primary" />
            Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo usuário na plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-user-name">Nome</Label>
            <Input
              id="new-user-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Nome completo"
              required
            />
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-email">E-mail</Label>
            <Input
              id="new-user-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
            {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-user-password">Senha</Label>
            <Input
              id="new-user-password"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
            {fieldErrors.password && <p className="text-sm text-red-500">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tipo de Usuário</Label>
            <Select
              value={form.userType}
              onValueChange={(v) => handleUserTypeChange(v as UserType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="colaborador">Colaborador</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showClient && (
            <div className="space-y-2">
              <Label>Empresa Vinculada</Label>
              <ClientCombobox
                clients={clients}
                value={form.clientId}
                onChange={(v) => update('clientId', v)}
                invalid={!!fieldErrors.client}
              />
              {fieldErrors.client && <p className="text-sm text-red-500">{fieldErrors.client}</p>}
            </div>
          )}
          {showAccessProfile && (
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select
                value={form.accessProfile}
                onValueChange={(v) => update('accessProfile', v)}
                disabled={form.userType === 'admin'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {form.userType === 'admin'
                    ? profiles
                        .filter((p) => p.name === 'Administrador' && p.status === 'active')
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))
                    : profiles
                        .filter((p) => p.name !== 'Administrador' && p.status === 'active')
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                </SelectContent>
              </Select>
              {form.userType === 'admin' && (
                <p className="text-xs text-muted-foreground">
                  O perfil Administrador é atribuído automaticamente.
                </p>
              )}
              {fieldErrors.access_profile && (
                <p className="text-sm text-red-500">{fieldErrors.access_profile}</p>
              )}
            </div>
          )}
          <div className={`grid gap-3 ${isCliente ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="Convite pendente">Convite pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showDepartment && (
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={form.department} onValueChange={(v) => update('department', v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

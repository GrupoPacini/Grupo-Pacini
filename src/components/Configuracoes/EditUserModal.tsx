import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Loader2 } from 'lucide-react'
import { updateUser, type UserRecord } from '@/services/users'
import type { AccessProfileRecord } from '@/services/access-profiles'
import type { DepartmentRecord } from '@/services/departments'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { getAllClientsForImport } from '@/services/clients'
import { ClientCombobox } from '@/components/ClientCombobox'
import { useUserForm, type UserType } from '@/hooks/use-user-form'

interface EditUserModalProps {
  user: UserRecord | null
  departments: DepartmentRecord[]
  profiles: AccessProfileRecord[]
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}

export function EditUserModal({
  user,
  departments,
  profiles,
  currentUserId,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const {
    form,
    update,
    setUserType,
    isCliente,
    showAccessProfile,
    showDepartment,
    showClient,
    validate,
    buildUpdatePayload,
  } = useUserForm(user)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const isSelf = user?.id === currentUserId
  const originalProfile = user?.access_profile || 'none'
  const profileChanged = form.accessProfile !== originalProfile
  const originalRole = user?.role || 'colaborador'
  const roleChanged = form.userType !== originalRole

  const dropdownProfiles = useMemo(() => {
    const result = [...profiles]
    const currentProfile = user?.expand?.access_profile
    if (currentProfile && currentProfile.status !== 'active') {
      if (!result.find((p) => p.id === currentProfile.id)) {
        result.unshift(currentProfile)
      }
    }
    return result
  }, [profiles, user])

  useEffect(() => {
    if (user) {
      getAllClientsForImport()
        .then(setClients)
        .catch(() => {})
      setFieldErrors({})
    }
  }, [user])

  const handleUserTypeChange = (type: UserType) => {
    setUserType(type)
    setFieldErrors({})
  }

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    if (profileChanged || roleChanged) {
      setShowConfirm(true)
      return
    }
    void doSave()
  }

  const doSave = async () => {
    setShowConfirm(false)
    if (!user) return
    setLoading(true)
    setFieldErrors({})
    try {
      await updateUser(user.id, buildUpdatePayload())
      toast.success('Perfil atualizado com sucesso.')
      onClose()
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Edite as informações do usuário.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveClick} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <Select
                value={form.userType}
                onValueChange={(v) => handleUserTypeChange(v as UserType)}
                disabled={isSelf}
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
              {isSelf && (
                <p className="text-xs text-muted-foreground">
                  Você não pode alterar seu próprio tipo de usuário.
                </p>
              )}
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
                  disabled={isSelf}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {dropdownProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.status !== 'active' ? ' (Inativo)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSelf && (
                  <p className="text-xs text-muted-foreground">
                    Você não pode alterar seu próprio perfil de acesso.
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
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar os dados de {user?.name || 'este usuário'}? Esta ação
              pode afetar as permissões do usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doSave()}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState<string>('none')
  const [accessProfile, setAccessProfile] = useState<string>('none')
  const [userType, setUserType] = useState<string>('colaborador')
  const [clientId, setClientId] = useState<string>('')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const isSelf = user?.id === currentUserId
  const originalProfile = user?.access_profile || 'none'
  const profileChanged = accessProfile !== originalProfile
  const originalRole = user?.role || 'colaborador'
  const roleChanged = userType !== originalRole

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
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setDepartment(user.department || 'none')
      setAccessProfile(user.access_profile || 'none')
      setUserType(user.role || 'colaborador')
      setClientId(user.client || '')
      setFieldErrors({})
    }
  }, [user])

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault()
    if (userType !== 'Cliente' && accessProfile === 'none') {
      setFieldErrors({ access_profile: 'Selecione um perfil de acesso' })
      return
    }
    if (userType === 'Cliente' && !clientId) {
      setFieldErrors({ client: 'Selecione a empresa vinculada' })
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
      await updateUser(user.id, {
        name,
        email,
        department: userType === 'Cliente' ? null : department === 'none' ? null : department,
        access_profile: userType === 'Cliente' ? null : accessProfile,
        role: userType,
        client: userType === 'Cliente' ? clientId || null : null,
      })
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo de Usuário</Label>
              <Select value={userType} onValueChange={setUserType} disabled={isSelf}>
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
            {userType === 'Cliente' && (
              <div className="space-y-2">
                <Label>Empresa Vinculada</Label>
                <ClientCombobox
                  clients={clients}
                  value={clientId}
                  onChange={setClientId}
                  invalid={!!fieldErrors.client}
                />
                {fieldErrors.client && <p className="text-sm text-red-500">{fieldErrors.client}</p>}
              </div>
            )}
            {userType !== 'Cliente' && (
              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select value={accessProfile} onValueChange={setAccessProfile} disabled={isSelf}>
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
            {userType !== 'Cliente' && (
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={department} onValueChange={setDepartment}>
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

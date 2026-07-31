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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Lock } from 'lucide-react'
import {
  createAccessProfile,
  updateAccessProfile,
  type AccessProfileRecord,
} from '@/services/access-profiles'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

interface ProfileFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: AccessProfileRecord | null
  onSuccess: () => void
  existingNames: string[]
}

export function ProfileFormModal({
  open,
  onOpenChange,
  profile,
  onSuccess,
  existingNames,
}: ProfileFormModalProps) {
  const isEditing = !!profile
  const isSystem = profile?.system ?? false
  const isAdminProfile = profile?.name === 'Administrador'

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (open) {
      setName(profile?.name ?? '')
      setDescription(profile?.description ?? '')
      setStatus(profile?.status ?? 'active')
      setFieldErrors({})
    }
  }, [open, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setFieldErrors({ name: 'Nome é obrigatório' })
      return
    }

    const otherNames = existingNames.filter(
      (n) => n.toLowerCase() !== (profile?.name ?? '').toLowerCase(),
    )
    if (otherNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase())) {
      setFieldErrors({ name: 'Já existe um perfil com este nome' })
      return
    }

    setLoading(true)
    setFieldErrors({})

    try {
      if (isEditing && profile) {
        const updateData: Record<string, unknown> = {}
        if (!isAdminProfile) {
          updateData.name = trimmedName
        }
        updateData.description = description.trim()
        if (!isAdminProfile) {
          updateData.status = status
        }
        await updateAccessProfile(profile.id, updateData)
        toast.success('Perfil atualizado com sucesso')
      } else {
        await createAccessProfile({
          name: trimmedName,
          description: description.trim(),
          status,
        })
        toast.success('Perfil criado com sucesso')
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error(isEditing ? 'Erro ao atualizar perfil' : 'Erro ao criar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Perfil' : 'Novo Perfil'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do perfil de acesso.'
              : 'Preencha os dados para criar um novo perfil de acesso.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do perfil"
              required
              disabled={isAdminProfile}
            />
            {isAdminProfile && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock size={12} />
                O nome do perfil Administrador não pode ser alterado
              </p>
            )}
            {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-description">Descrição</Label>
            <Textarea
              id="profile-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do perfil (opcional)"
              rows={3}
            />
            {fieldErrors.description && (
              <p className="text-sm text-red-500">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as 'active' | 'inactive')}
              disabled={isAdminProfile}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            {isAdminProfile && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock size={12} />
                O status do perfil Administrador não pode ser alterado
              </p>
            )}
            {fieldErrors.status && <p className="text-sm text-red-500">{fieldErrors.status}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
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
  )
}

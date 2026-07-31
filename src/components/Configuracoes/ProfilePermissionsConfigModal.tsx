import { useState, useEffect } from 'react'
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, RotateCcw } from 'lucide-react'
import { updateAccessProfile, type AccessProfileRecord } from '@/services/access-profiles'
import {
  MODULE_CONFIGS,
  LOCKED_ADMIN_MODULES,
  normalizePermissions,
  type Permissions,
} from '@/lib/permissions-config'
import { PermissionModuleRow } from './PermissionModuleRow'
import { toast } from 'sonner'

interface ProfilePermissionsConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: AccessProfileRecord | null
  onSuccess: () => void
}

export function ProfilePermissionsConfigModal({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: ProfilePermissionsConfigModalProps) {
  const [permissions, setPermissions] = useState<Permissions>({})
  const [initial, setInitial] = useState<Permissions>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAdmin = profile?.name === 'Administrador'

  useEffect(() => {
    if (open && profile) {
      const loaded = normalizePermissions(profile.permissions)
      if (isAdmin) {
        for (const mod of LOCKED_ADMIN_MODULES) {
          const config = MODULE_CONFIGS.find((c) => c.module === mod)
          if (config) loaded[mod] = [...config.actions]
        }
      }
      setPermissions(loaded)
      setInitial(loaded)
    }
  }, [open, profile, isAdmin])

  const isLocked = (mod: string) => isAdmin && LOCKED_ADMIN_MODULES.includes(mod)
  const isDirty = JSON.stringify(permissions) !== JSON.stringify(initial)
  const totalActions = Object.values(permissions).reduce((s, a) => s + a.length, 0)
  const canSave = totalActions > 0 && isDirty
  const allChecked = MODULE_CONFIGS.every((c) => {
    const perms = permissions[c.module] || []
    return c.actions.every((a) => perms.includes(a))
  })

  const toggleAction = (mod: string, action: string, checked: boolean) => {
    if (isLocked(mod)) return
    setPermissions((prev) => {
      const current = prev[mod] || []
      return {
        ...prev,
        [mod]: checked ? [...current, action] : current.filter((a) => a !== action),
      }
    })
  }

  const toggleModule = (mod: string, checked: boolean) => {
    if (isLocked(mod)) return
    const config = MODULE_CONFIGS.find((c) => c.module === mod)
    if (!config) return
    setPermissions((prev) => ({ ...prev, [mod]: checked ? [...config.actions] : [] }))
  }

  const toggleAll = (checked: boolean) => {
    setPermissions(() => {
      const updated: Permissions = {}
      for (const config of MODULE_CONFIGS) {
        updated[config.module] = isLocked(config.module)
          ? [...config.actions]
          : checked
            ? [...config.actions]
            : []
      }
      return updated
    })
  }

  const handleRestore = () => setPermissions(initial)

  const handleSave = async () => {
    if (!profile) return
    setLoading(true)
    try {
      await updateAccessProfile(profile.id, { permissions })
      toast.success('Permissões atualizadas com sucesso')
      setShowConfirm(false)
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Erro ao salvar permissões')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Configurar Permissões – {profile.name}</DialogTitle>
            <DialogDescription>Marque as ações permitidas para cada módulo.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              id="select-all-perms"
              checked={allChecked}
              onCheckedChange={(v) => toggleAll(v === true)}
            />
            <label htmlFor="select-all-perms" className="text-sm font-medium cursor-pointer">
              Selecionar todas as permissões do perfil
            </label>
          </div>
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-2">
              {MODULE_CONFIGS.map((config) => (
                <PermissionModuleRow
                  key={config.module}
                  config={config}
                  selectedActions={permissions[config.module] || []}
                  locked={isLocked(config.module)}
                  onToggleModule={(checked) => toggleModule(config.module, checked)}
                  onToggleAction={(action, checked) => toggleAction(config.module, action, checked)}
                />
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="flex justify-between sm:justify-between">
            {isDirty ? (
              <Button variant="outline" size="sm" onClick={handleRestore} className="gap-2">
                <RotateCcw size={14} />
                Restaurar alterações
              </Button>
            ) : (
              <div />
            )}
            <Button
              disabled={!canSave}
              onClick={() => {
                if (totalActions === 0) {
                  toast.error('O perfil deve ter pelo menos uma permissão.')
                  return
                }
                setShowConfirm(true)
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja salvar as alterações de permissões para o perfil {profile.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

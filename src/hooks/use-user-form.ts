import { useState, useEffect, useCallback, useMemo } from 'react'
import type { UserRecord } from '@/services/users'
import type { AccessProfileRecord } from '@/services/access-profiles'
import type { FieldErrors } from '@/lib/pocketbase/errors'

export interface UserFormValues {
  name: string
  email: string
  password: string
  accessProfile: string
  status: string
  department: string
  clientId: string
}

const DEFAULT_VALUES: UserFormValues = {
  name: '',
  email: '',
  password: '',
  accessProfile: 'none',
  status: 'Ativo',
  department: 'none',
  clientId: '',
}

export function useUserForm(initialUser?: UserRecord | null, profiles?: AccessProfileRecord[]) {
  const [form, setForm] = useState<UserFormValues>(DEFAULT_VALUES)

  const allProfiles = useMemo(() => profiles || [], [profiles])

  const selectedProfile = useMemo(
    () => allProfiles.find((p) => p.id === form.accessProfile),
    [allProfiles, form.accessProfile],
  )

  const isCliente = selectedProfile?.name === 'Cliente'

  useEffect(() => {
    if (initialUser) {
      setForm({
        name: initialUser.name || '',
        email: initialUser.email || '',
        password: '',
        accessProfile: initialUser.access_profile || 'none',
        status: initialUser.status || 'Ativo',
        department: initialUser.department || 'none',
        clientId: initialUser.client || '',
      })
    } else {
      setForm(DEFAULT_VALUES)
    }
  }, [initialUser])

  useEffect(() => {
    if (!initialUser && allProfiles.length > 0 && form.accessProfile === 'none') {
      const defaultProfile = allProfiles.find(
        (p) => p.status === 'active' && p.name !== 'Administrador' && p.name !== 'Cliente',
      )
      if (defaultProfile) {
        setForm((prev) => ({ ...prev, accessProfile: defaultProfile.id }))
      }
    }
  }, [allProfiles, initialUser, form.accessProfile])

  const update = useCallback(<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setForm(DEFAULT_VALUES), [])

  const showAccessProfile = true
  const showDepartment = !isCliente
  const showClient = isCliente

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {}
    if (form.accessProfile === 'none') {
      errors.access_profile = 'Selecione um perfil de acesso'
    }
    if (isCliente && !form.clientId) {
      errors.client = 'Selecione a empresa vinculada ao usuário.'
    }
    return errors
  }, [form, isCliente])

  const buildCreatePayload = useCallback(
    () => ({
      name: form.name,
      email: form.email,
      password: form.password,
      passwordConfirm: form.password,
      department: isCliente ? null : form.department === 'none' ? null : form.department,
      access_profile: form.accessProfile === 'none' ? null : form.accessProfile,
      client: isCliente ? form.clientId || null : null,
      status: form.status,
    }),
    [form, isCliente],
  )

  const buildUpdatePayload = useCallback(
    () => ({
      name: form.name,
      email: form.email,
      department: isCliente ? null : form.department === 'none' ? null : form.department,
      access_profile: form.accessProfile === 'none' ? null : form.accessProfile,
      client: isCliente ? form.clientId || null : null,
      status: form.status,
    }),
    [form, isCliente],
  )

  return {
    form,
    update,
    reset,
    isCliente,
    showAccessProfile,
    showDepartment,
    showClient,
    validate,
    buildCreatePayload,
    buildUpdatePayload,
  }
}

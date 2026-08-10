import { useState, useEffect, useCallback } from 'react'
import type { UserRecord } from '@/services/users'
import type { FieldErrors } from '@/lib/pocketbase/errors'

export type UserType = 'admin' | 'colaborador' | 'Cliente'

export interface UserFormValues {
  name: string
  email: string
  password: string
  userType: UserType
  accessProfile: string
  status: string
  department: string
  clientId: string
}

const DEFAULT_VALUES: UserFormValues = {
  name: '',
  email: '',
  password: '',
  userType: 'colaborador',
  accessProfile: 'none',
  status: 'Ativo',
  department: 'none',
  clientId: '',
}

export function useUserForm(initialUser?: UserRecord | null) {
  const [form, setForm] = useState<UserFormValues>(DEFAULT_VALUES)

  useEffect(() => {
    if (initialUser) {
      setForm({
        name: initialUser.name || '',
        email: initialUser.email || '',
        password: '',
        userType: (initialUser.role as UserType) || 'colaborador',
        accessProfile: initialUser.access_profile || 'none',
        status: initialUser.status || 'Ativo',
        department: initialUser.department || 'none',
        clientId: initialUser.client || '',
      })
    } else {
      setForm(DEFAULT_VALUES)
    }
  }, [initialUser])

  const setUserType = useCallback((type: UserType) => {
    setForm((prev) => {
      const next = { ...prev, userType: type }
      if (type === 'Cliente') {
        next.accessProfile = 'none'
        next.department = 'none'
      } else {
        next.clientId = ''
      }
      return next
    })
  }, [])

  const update = useCallback(<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setForm(DEFAULT_VALUES), [])

  const isCliente = form.userType === 'Cliente'

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {}
    if (!isCliente && form.accessProfile === 'none') {
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
      role: form.userType,
      department: isCliente ? null : form.department === 'none' ? null : form.department,
      access_profile: isCliente ? null : form.accessProfile === 'none' ? null : form.accessProfile,
      client: isCliente ? form.clientId || null : null,
      status: form.status,
    }),
    [form, isCliente],
  )

  const buildUpdatePayload = useCallback(
    () => ({
      name: form.name,
      email: form.email,
      role: form.userType,
      department: isCliente ? null : form.department === 'none' ? null : form.department,
      access_profile: isCliente ? null : form.accessProfile === 'none' ? null : form.accessProfile,
      client: isCliente ? form.clientId || null : null,
      status: form.status,
    }),
    [form, isCliente],
  )

  return {
    form,
    update,
    setUserType,
    reset,
    isCliente,
    showAccessProfile: !isCliente,
    showDepartment: !isCliente,
    showClient: isCliente,
    validate,
    buildCreatePayload,
    buildUpdatePayload,
  }
}

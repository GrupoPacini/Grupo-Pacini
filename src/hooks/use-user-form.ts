import { useState, useEffect, useCallback, useMemo } from 'react'
import type { UserRecord } from '@/services/users'
import type { AccessProfileRecord } from '@/services/access-profiles'
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

export function useUserForm(initialUser?: UserRecord | null, profiles?: AccessProfileRecord[]) {
  const [form, setForm] = useState<UserFormValues>(DEFAULT_VALUES)

  const adminProfileId = useMemo(() => {
    const p = profiles?.find((pr) => pr.name === 'Administrador' && pr.status === 'active')
    return p?.id || ''
  }, [profiles])

  const colaboradorProfiles = useMemo(
    () => (profiles || []).filter((pr) => pr.name !== 'Administrador' && pr.status === 'active'),
    [profiles],
  )

  const singleColaboradorProfileId = useMemo(
    () => (colaboradorProfiles.length === 1 ? colaboradorProfiles[0].id : ''),
    [colaboradorProfiles],
  )

  useEffect(() => {
    if (initialUser) {
      const role = (initialUser.role as UserType) || 'colaborador'
      setForm({
        name: initialUser.name || '',
        email: initialUser.email || '',
        password: '',
        userType: role,
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
    if (!initialUser) {
      setForm((prev) => {
        if (prev.userType === 'admin' && adminProfileId && prev.accessProfile !== adminProfileId) {
          return { ...prev, accessProfile: adminProfileId }
        }
        if (
          prev.userType === 'colaborador' &&
          singleColaboradorProfileId &&
          prev.accessProfile === 'none'
        ) {
          return { ...prev, accessProfile: singleColaboradorProfileId }
        }
        return prev
      })
    }
  }, [adminProfileId, singleColaboradorProfileId, initialUser])

  const setUserType = useCallback(
    (type: UserType) => {
      setForm((prev) => {
        const next = { ...prev, userType: type }
        if (type === 'Cliente') {
          next.accessProfile = 'none'
          next.department = 'none'
        } else if (type === 'admin') {
          next.accessProfile = adminProfileId || 'none'
          next.clientId = ''
        } else {
          next.clientId = ''
          if (singleColaboradorProfileId) {
            next.accessProfile = singleColaboradorProfileId
          } else if (prev.accessProfile === adminProfileId) {
            next.accessProfile = 'none'
          }
        }
        return next
      })
    },
    [adminProfileId, singleColaboradorProfileId],
  )

  const update = useCallback(<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setForm(DEFAULT_VALUES), [])

  const isCliente = form.userType === 'Cliente'
  const showAccessProfile = form.userType === 'colaborador' && colaboradorProfiles.length > 1
  const showDepartment = !isCliente
  const showClient = isCliente

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {}
    if (
      form.userType === 'colaborador' &&
      colaboradorProfiles.length > 1 &&
      form.accessProfile === 'none'
    ) {
      errors.access_profile = 'Selecione um perfil de acesso'
    }
    if (form.userType === 'Cliente' && !form.clientId) {
      errors.client = 'Selecione a empresa vinculada ao usuário.'
    }
    return errors
  }, [form, colaboradorProfiles])

  const resolveAccessProfile = useCallback((): string | null => {
    if (isCliente) return null
    if (form.userType === 'admin') {
      return adminProfileId || (form.accessProfile !== 'none' ? form.accessProfile : null)
    }
    return form.accessProfile === 'none' ? null : form.accessProfile
  }, [form, isCliente, adminProfileId])

  const buildCreatePayload = useCallback(
    () => ({
      name: form.name,
      email: form.email,
      password: form.password,
      passwordConfirm: form.password,
      role: form.userType,
      department: isCliente ? null : form.department === 'none' ? null : form.department,
      access_profile: resolveAccessProfile(),
      client: isCliente ? form.clientId || null : null,
      status: form.status,
    }),
    [form, isCliente, resolveAccessProfile],
  )

  const buildUpdatePayload = useCallback(
    () => ({
      name: form.name,
      email: form.email,
      role: form.userType,
      department: isCliente ? null : form.department === 'none' ? null : form.department,
      access_profile: resolveAccessProfile(),
      client: isCliente ? form.clientId || null : null,
      status: form.status,
    }),
    [form, isCliente, resolveAccessProfile],
  )

  return {
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
    buildUpdatePayload,
  }
}

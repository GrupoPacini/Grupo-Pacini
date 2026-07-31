import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { normalizePermissions, type Permissions } from '@/lib/permissions-config'
import { can as canCheck, canViewModule } from '@/lib/permissions'

interface PermissionsContextType {
  permissions: Permissions | null
  can: (module: string, action: string) => boolean
  canView: (module: string) => boolean
  loading: boolean
  profileInactive: boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (!context) throw new Error('usePermissions must be used within a PermissionProvider')
  return context
}

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileInactive, setProfileInactive] = useState(false)

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions(null)
      setProfileInactive(false)
      setLoading(false)
      return
    }

    const profileId = user.access_profile
    if (!profileId) {
      setProfileInactive(true)
      setPermissions(null)
      setLoading(false)
      if (import.meta.env.DEV) {
        console.warn('[permissions] User has no access_profile linked')
      }
      return
    }

    setLoading(true)
    try {
      const profile = await pb.collection('access_profiles').getOne(profileId)
      if (profile.status !== 'active') {
        setProfileInactive(true)
        setPermissions(null)
        if (import.meta.env.DEV) {
          console.warn('[permissions] Access profile is inactive:', profileId)
        }
      } else {
        setProfileInactive(false)
        setPermissions(normalizePermissions(profile.permissions))
      }
    } catch (err) {
      setProfileInactive(true)
      setPermissions(null)
      if (import.meta.env.DEV) {
        console.warn('[permissions] Failed to load access profile:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (authLoading) return
    loadProfile()
  }, [authLoading, loadProfile])

  useRealtime('access_profiles', () => {
    loadProfile()
  })
  useRealtime('users', () => {
    loadProfile()
  })

  const can = useCallback(
    (module: string, action: string) => canCheck(permissions, module, action, isAdmin),
    [permissions, isAdmin],
  )

  const canView = useCallback(
    (module: string) => canViewModule(permissions, module, isAdmin),
    [permissions, isAdmin],
  )

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        can,
        canView,
        loading: authLoading || loading,
        profileInactive,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

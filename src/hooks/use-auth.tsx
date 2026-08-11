import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  isAdmin: boolean
  isCliente: boolean
  clientId: string | null
  profileName: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileName, setProfileName] = useState<string | null>(null)

  const isAdmin = profileName === 'Administrador'
  const isCliente = profileName === 'Cliente'
  const clientId = user?.client || null

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      const valid = pb.authStore.isValid
      setUser(valid ? record : null)
      setIsAuthenticated(valid)
      if (valid) {
        setLoading(true)
      } else {
        setProfileName(null)
        setLoading(false)
      }
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .catch(() => pb.authStore.clear())
    } else {
      if (pb.authStore.record) pb.authStore.clear()
      setLoading(false)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setProfileName(null)
      return
    }
    if (!user?.access_profile) {
      setProfileName(null)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    pb.collection('access_profiles')
      .getOne(user.access_profile)
      .then((profile: any) => {
        if (active) setProfileName(profile.name || null)
      })
      .catch(() => {
        if (active) setProfileName(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isAuthenticated, user])

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      pb.send('/backend/v1/track-access', { method: 'POST' }).catch(() => {})
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isCliente,
        clientId,
        profileName,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

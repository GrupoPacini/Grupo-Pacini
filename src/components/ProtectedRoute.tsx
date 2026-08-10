import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { getModuleFromPath } from '@/lib/permissions'

export const ProtectedRoute = () => {
  const { isAuthenticated, loading: authLoading, isCliente } = useAuth()
  const { loading: permsLoading, profileInactive, canView } = usePermissions()
  const location = useLocation()

  if (authLoading || permsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medium">Carregando Sistema...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isCliente) {
    if (location.pathname === '/relatorio-financeiro') {
      return <Outlet />
    }
    return <Navigate to="/relatorio-financeiro" replace />
  }

  if (profileInactive && location.pathname !== '/perfil-inativo') {
    return <Navigate to="/perfil-inativo" replace />
  }

  const module = getModuleFromPath(location.pathname)
  if (module && !canView(module) && location.pathname !== '/access-denied') {
    return <Navigate to="/access-denied" replace />
  }

  return <Outlet />
}

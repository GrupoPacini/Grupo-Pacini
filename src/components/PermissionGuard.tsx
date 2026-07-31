import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/use-permissions'

interface PermissionGuardProps {
  module: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  module,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can } = usePermissions()
  if (!can(module, action)) return <>{fallback}</>
  return <>{children}</>
}

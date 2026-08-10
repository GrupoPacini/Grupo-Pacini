import { useAuth } from '@/hooks/use-auth'
import { ClientLayout } from '@/components/ClientLayout'
import Layout from '@/components/Layout'

export function AdaptiveLayout() {
  const { isCliente } = useAuth()
  return isCliente ? <ClientLayout /> : <Layout />
}

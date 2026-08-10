import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { PermissionProvider } from '@/hooks/use-permissions'

import Login from './pages/Login'
import Index from './pages/Index'
import Processos from './pages/Processos'
import ModelosProcesso from './pages/ModelosProcesso'
import Clientes from './pages/Clientes'
import ClientDetail from './pages/ClientDetail'
import ClientFormPage from './pages/ClientFormPage'
import Playbooks from './pages/Playbooks'
import Licenses from './pages/Licenses'
import Renewals from './pages/Renewals'
import RelatorioFinanceiro from './pages/RelatorioFinanceiro'
import Chat from './pages/Chat'
import Configuracoes from './pages/Configuracoes'
import GestaoUsuarios from './pages/GestaoUsuarios'
import PerfisAcesso from './pages/PerfisAcesso'
import AccessDenied from './pages/AccessDenied'
import PerfilInativo from './pages/PerfilInativo'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/access-denied', element: <AccessDenied /> },
      { path: '/perfil-inativo', element: <PerfilInativo /> },
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Index /> },
          { path: '/processos', element: <Processos /> },
          { path: '/modelos-processo', element: <ModelosProcesso /> },
          { path: '/clientes', element: <Clientes /> },
          { path: '/clientes/novo', element: <ClientFormPage /> },
          { path: '/clientes/:id/editar', element: <ClientFormPage /> },
          { path: '/clientes/:id', element: <ClientDetail /> },
          { path: '/playbooks', element: <Playbooks /> },
          { path: '/licencas', element: <Licenses /> },
          { path: '/renovacoes', element: <Renewals /> },
          { path: '/relatorio-financeiro', element: <RelatorioFinanceiro /> },
          { path: '/chat', element: <Chat /> },
          { path: '/configuracoes', element: <Configuracoes /> },
          { path: '/configuracoes/usuarios', element: <GestaoUsuarios /> },
          { path: '/configuracoes/perfis', element: <PerfisAcesso /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

const App = () => (
  <AuthProvider>
    <PermissionProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </PermissionProvider>
  </AuthProvider>
)

export default App

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { PermissionProvider } from '@/hooks/use-permissions'

import Login from './pages/Login'
import Index from './pages/Index'
import Processos from './pages/Processos'
import Clientes from './pages/Clientes'
import ClientDetail from './pages/ClientDetail'
import Playbooks from './pages/Playbooks'
import Licenses from './pages/Licenses'
import Renewals from './pages/Renewals'
import Chat from './pages/Chat'
import Configuracoes from './pages/Configuracoes'
import GestaoUsuarios from './pages/GestaoUsuarios'
import PerfisAcesso from './pages/PerfisAcesso'
import AccessDenied from './pages/AccessDenied'
import PerfilInativo from './pages/PerfilInativo'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <PermissionProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="/perfil-inativo" element={<PerfilInativo />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/processos" element={<Processos />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/clientes/:id" element={<ClientDetail />} />
                <Route path="/playbooks" element={<Playbooks />} />
                <Route path="/licencas" element={<Licenses />} />
                <Route path="/renovacoes" element={<Renewals />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/configuracoes/usuarios" element={<GestaoUsuarios />} />
                <Route path="/configuracoes/perfis" element={<PerfisAcesso />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </PermissionProvider>
  </AuthProvider>
)

export default App

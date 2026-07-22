import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'

import Login from './pages/Login'
import Index from './pages/Index'
import Processos from './pages/Processos'
import Clientes from './pages/Clientes'
import Playbooks from './pages/Playbooks'
import Licenses from './pages/Licenses'
import Renewals from './pages/Renewals'
import Chat from './pages/Chat'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/processos" element={<Processos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/playbooks" element={<Playbooks />} />
              <Route path="/licencas" element={<Licenses />} />
              <Route path="/renovacoes" element={<Renewals />} />
              <Route path="/chat" element={<Chat />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App

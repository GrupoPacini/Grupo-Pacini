import { useState } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, isAuthenticated, loading, isCliente } = useAuth()
  const location = useLocation()
  const { toast } = useToast()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center login-bg">
        <div className="animate-pulse text-primary-foreground font-medium">
          Carregando Sistema...
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={isCliente ? '/relatorio-financeiro' : from} replace />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Credenciais inválidas. Verifique seu e-mail e senha.',
      })
      setIsLoading(false)
    }
    // On success, the AuthProvider loads the access_profile relation
    // and sets isCliente. The isAuthenticated guard above handles
    // redirection based on isCliente — no role check needed here.
  }

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="login-glow login-glow-top" />
      <div className="login-glow login-glow-bottom" />

      <Card className="w-full max-w-md z-10 shadow-2xl border-none animate-fade-in-up">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto mb-2 flex justify-center">
            <img
              src="/LOGO PRINCIPAL -  AZUL-e7ee8.png"
              alt="Grupo Pacini - Inteligência Contábil"
              className="h-28 w-auto max-w-full object-contain"
            />
          </div>
          <CardDescription className="text-muted-foreground">
            Acesse o portal de gestão contábil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Corporativo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
                placeholder="nome@grupopacini.com.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
              <div className="flex justify-end">
                <Link
                  to="/recuperar-senha"
                  className="text-sm text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Acessar Portal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

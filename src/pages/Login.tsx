import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('patricia@grupopacini.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
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
    } else {
      navigate('/')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/1200/800?q=office&color=black')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>

      <Card className="w-full max-w-md z-10 shadow-2xl border-none">
        <CardHeader className="space-y-3 text-center pb-8">
          <div className="mx-auto w-16 h-16 rounded-lg bg-pacini-gradient flex items-center justify-center mb-2">
            <span className="text-primary text-3xl font-bold">P</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary text-title-case">
            Grupo Pacini
          </CardTitle>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white transition-all"
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

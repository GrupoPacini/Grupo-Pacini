import { useState, useEffect, useRef } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getClientById,
  createClientRecord,
  updateClientRecord,
  checkCNPJDuplicate,
  checkCodeDuplicate,
} from '@/services/clients'
import { maskCNPJ, unmaskCNPJ, validateCNPJ, type ClientRecord } from '@/lib/client-utils'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']

interface ClientFormData {
  razao_social: string
  nome_fantasia: string
  code: string
  codigo_acesso: string
  cnpj: string
  tax_regime: string
  situacao_cadastral: string
  data_abertura: string
  client_status: string
  nome_contato: string
  email_principal: string
  telefone: string
  whatsapp: string
}

const emptyForm: ClientFormData = {
  razao_social: '',
  nome_fantasia: '',
  code: '',
  codigo_acesso: '',
  cnpj: '',
  tax_regime: '',
  situacao_cadastral: '',
  data_abertura: '',
  client_status: 'Ativo',
  nome_contato: '',
  email_principal: '',
  telefone: '',
  whatsapp: '',
}

function mapClientToForm(c: ClientRecord): ClientFormData {
  return {
    razao_social: c.razao_social || c.name || '',
    nome_fantasia: c.nome_fantasia || c.alias || '',
    code: c.code || '',
    codigo_acesso: (c.codigo_acesso as string) || '',
    cnpj: c.cnpj ? maskCNPJ(c.cnpj) : '',
    tax_regime: c.tax_regime || '',
    situacao_cadastral: c.situacao_cadastral || '',
    data_abertura: c.data_abertura || '',
    client_status: c.client_status || 'Ativo',
    nome_contato: c.nome_contato || '',
    email_principal: c.email_principal || '',
    telefone: c.telefone || '',
    whatsapp: c.whatsapp || '',
  }
}

interface Props {
  mode: 'create' | 'edit'
  clientId?: string
  initialClient?: ClientRecord | null
  onSuccess: (clientId: string) => void
  onCancel: () => void
}

export function ClientForm({ mode, clientId, initialClient, onSuccess, onCancel }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState<ClientFormData>(emptyForm)
  const [initialForm, setInitialForm] = useState(JSON.stringify(emptyForm))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(mode === 'edit' && !initialClient)
  const [submitting, setSubmitting] = useState(false)
  const savedRef = useRef(false)

  const isDirty = JSON.stringify(form) !== initialForm

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }: any) =>
      !savedRef.current &&
      isDirty &&
      !submitting &&
      currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    const loadData = async () => {
      if (mode === 'edit') {
        if (initialClient) {
          const mapped = mapClientToForm(initialClient)
          setForm(mapped)
          setInitialForm(JSON.stringify(mapped))
          setLoading(false)
        } else if (clientId) {
          try {
            const c = await getClientById(clientId)
            const mapped = mapClientToForm(c)
            setForm(mapped)
            setInitialForm(JSON.stringify(mapped))
          } catch {
            toast.error('Erro ao carregar cliente')
            navigate('/clientes')
          } finally {
            setLoading(false)
          }
        }
      } else {
        setInitialForm(JSON.stringify(emptyForm))
        setLoading(false)
      }
    }
    loadData()
  }, [mode, clientId, initialClient, navigate])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !savedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const set = (k: keyof ClientFormData) => (v: string) => {
    savedRef.current = false
    setForm((prev) => ({ ...prev, [k]: v }))
    setErrors((prev) => {
      if (!prev[k]) return prev
      const next = { ...prev }
      delete next[k]
      return next
    })
  }

  const handleCnpjChange = (v: string) => {
    savedRef.current = false
    setForm((prev) => ({ ...prev, cnpj: maskCNPJ(v) }))
    setErrors((prev) => {
      if (!prev.cnpj) return prev
      const next = { ...prev }
      delete next.cnpj
      return next
    })
  }

  const validate = (): boolean => {
    const errs: FieldErrors = {}
    if (!form.code.trim()) errs.code = 'Código Interno é obrigatório'
    if (!form.razao_social.trim()) errs.razao_social = 'Razão Social é obrigatória'
    if (!form.cnpj.trim()) {
      errs.cnpj = 'CNPJ é obrigatório'
    } else {
      const clean = unmaskCNPJ(form.cnpj)
      if (clean.length !== 14) errs.cnpj = 'CNPJ deve ter 14 dígitos'
      else if (!validateCNPJ(clean)) errs.cnpj = 'CNPJ inválido'
    }
    if (!form.tax_regime) errs.tax_regime = 'Regime Tributário é obrigatório'
    if (!form.client_status) errs.client_status = 'Status do Cliente é obrigatório'
    if (form.email_principal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_principal)) {
      errs.email_principal = 'E-mail inválido'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (!isDirty && mode === 'edit') {
      toast.info('Nenhuma alteração detectada')
      return
    }
    setSubmitting(true)
    try {
      if (form.cnpj) {
        const clean = unmaskCNPJ(form.cnpj)
        const isDup = await checkCNPJDuplicate(clean, mode === 'edit' ? clientId : undefined)
        if (isDup) {
          setErrors({ cnpj: 'Este CNPJ já está cadastrado' })
          setSubmitting(false)
          return
        }
      }
      if (form.code.trim()) {
        const isCodeDup = await checkCodeDuplicate(
          form.code.trim(),
          mode === 'edit' ? clientId : undefined,
        )
        if (isCodeDup) {
          setErrors({ code: 'Já existe um cliente cadastrado com este Código Interno.' })
          setSubmitting(false)
          return
        }
      }

      const payload: Record<string, unknown> = {
        name: form.razao_social.trim(),
        razao_social: form.razao_social.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        alias: form.nome_fantasia.trim(),
        cnpj: form.cnpj ? unmaskCNPJ(form.cnpj) : '',
        code: form.code.trim(),
        codigo_acesso: form.codigo_acesso.trim(),
        tax_regime: form.tax_regime || null,
        situacao_cadastral: form.situacao_cadastral.trim() || null,
        data_abertura: form.data_abertura || null,
        client_status: form.client_status || 'Ativo',
        nome_contato: form.nome_contato.trim(),
        email_principal: form.email_principal.trim(),
        telefone: form.telefone.trim(),
        whatsapp: form.whatsapp.trim(),
      }

      let resultId: string
      if (mode === 'create') {
        const result = await createClientRecord(payload)
        resultId = result.id
        toast.success('Cliente cadastrado com sucesso')
      } else {
        await updateClientRecord(clientId!, payload)
        resultId = clientId!
        toast.success('Cliente atualizado com sucesso')
      }

      savedRef.current = true
      setInitialForm(JSON.stringify(form))
      onSuccess(resultId)
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => set('code')(e.target.value)}
                  placeholder="Ex: 0001 ou CLI-001"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Informe o mesmo código utilizado no sistema externo.
                </p>
                {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo-acesso">Código de Acesso</Label>
                <Input
                  id="codigo-acesso"
                  value={form.codigo_acesso}
                  onChange={(e) => set('codigo_acesso')(e.target.value)}
                  placeholder="Ex: ACC-001"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Informe o código utilizado para acesso ou identificação em outro sistema.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="razao-social">Razão Social *</Label>
                <Input
                  id="razao-social"
                  value={form.razao_social}
                  onChange={(e) => set('razao_social')(e.target.value)}
                  placeholder="Nome empresarial registrado"
                />
                {errors.razao_social && (
                  <p className="text-sm text-destructive">{errors.razao_social}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                <Input
                  id="nome-fantasia"
                  value={form.nome_fantasia}
                  onChange={(e) => set('nome_fantasia')(e.target.value)}
                  placeholder="Nome de divulgação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={form.cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="font-mono"
                />
                {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Tributárias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Regime Tributário *</Label>
                <Select
                  value={form.tax_regime || '__none__'}
                  onValueChange={(v) => set('tax_regime')(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {TAX_REGIMES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tax_regime && (
                  <p className="text-sm text-destructive">{errors.tax_regime}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="situacao">Situação Cadastral</Label>
                <Input
                  id="situacao"
                  value={form.situacao_cadastral}
                  onChange={(e) => set('situacao_cadastral')(e.target.value)}
                  placeholder="Ex: Ativa, Baixada"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-abertura">Data de Abertura</Label>
                <Input
                  id="data-abertura"
                  type="date"
                  value={form.data_abertura}
                  onChange={(e) => set('data_abertura')(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status do Cliente *</Label>
                <Select value={form.client_status} onValueChange={set('client_status')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.client_status && (
                  <p className="text-sm text-destructive">{errors.client_status}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome-contato">Nome do Contato</Label>
                <Input
                  id="nome-contato"
                  value={form.nome_contato}
                  onChange={(e) => set('nome_contato')(e.target.value)}
                  placeholder="Pessoa de contato na empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email_principal}
                  onChange={(e) => set('email_principal')(e.target.value)}
                  placeholder="contato@empresa.com.br"
                />
                {errors.email_principal && (
                  <p className="text-sm text-destructive">{errors.email_principal}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => set('telefone')(e.target.value)}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => set('whatsapp')(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(errors).length > 0}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar cliente'
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações não salvas. Deseja realmente sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

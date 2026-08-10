import { useState, useEffect, useRef } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  getClientContacts,
  createClientContact,
  updateClientContact,
  deleteClientContact,
  type ClientContact,
} from '@/services/client-contacts'
import { maskCNPJ, unmaskCNPJ, validateCNPJ, type ClientRecord } from '@/lib/client-utils'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Building2, MapPin, Users } from 'lucide-react'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']

interface ClientFormData {
  code: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  tax_regime: string
  cnae_principal: string
  inscricao_estadual: string
  inscricao_municipal: string
  ccm: string
  natureza_juridica: string
  porte: string
  data_abertura: string
  situacao_cadastral: string
  telefone: string
  celular: string
  email_principal: string
  site: string
  client_status: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  estado: string
}

interface ContactItem {
  id?: string
  nome: string
  email: string
  telefone: string
}

const emptyForm: ClientFormData = {
  code: '',
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  tax_regime: '',
  cnae_principal: '',
  inscricao_estadual: '',
  inscricao_municipal: '',
  ccm: '',
  natureza_juridica: '',
  porte: '',
  data_abertura: '',
  situacao_cadastral: '',
  telefone: '',
  celular: '',
  email_principal: '',
  site: '',
  client_status: 'Ativo',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  municipio: '',
  estado: '',
}

function mapClientToForm(c: ClientRecord): ClientFormData {
  return {
    code: c.code || '',
    razao_social: c.razao_social || c.name || '',
    nome_fantasia: c.nome_fantasia || c.alias || '',
    cnpj: c.cnpj ? maskCNPJ(c.cnpj) : '',
    tax_regime: c.tax_regime || '',
    cnae_principal: c.cnae_principal || '',
    inscricao_estadual: c.inscricao_estadual || '',
    inscricao_municipal: c.inscricao_municipal || '',
    ccm: c.ccm || '',
    natureza_juridica: c.natureza_juridica || '',
    porte: c.porte || '',
    data_abertura: c.data_abertura ? String(c.data_abertura).slice(0, 10) : '',
    situacao_cadastral: c.situacao_cadastral || '',
    telefone: c.telefone || '',
    celular: c.celular || '',
    email_principal: c.email_principal || '',
    site: c.site || '',
    client_status: c.client_status || 'Ativo',
    cep: c.cep || '',
    logradouro: c.logradouro || '',
    numero: c.numero || '',
    complemento: c.complemento || '',
    bairro: c.bairro || '',
    municipio: c.municipio || '',
    estado: c.estado || '',
  }
}

function mapContactToItem(c: ClientContact): ContactItem {
  return { id: c.id, nome: c.nome || '', email: c.email || '', telefone: c.telefone || '' }
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
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>([])
  const [initialState, setInitialState] = useState(
    JSON.stringify({ form: emptyForm, contacts: [] }),
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(mode === 'edit' && !initialClient)
  const [submitting, setSubmitting] = useState(false)
  const savedRef = useRef(false)

  const isDirty = JSON.stringify({ form, contacts }) !== initialState

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
        const targetId = initialClient?.id || clientId
        if (initialClient) {
          const mapped = mapClientToForm(initialClient)
          setForm(mapped)
          if (targetId) {
            try {
              const existing = await getClientContacts(targetId)
              const items = existing.map(mapContactToItem)
              setContacts(items)
              setInitialState(JSON.stringify({ form: mapped, contacts: items }))
            } catch {
              setInitialState(JSON.stringify({ form: mapped, contacts: [] }))
            }
          } else {
            setInitialState(JSON.stringify({ form: mapped, contacts: [] }))
          }
          setLoading(false)
        } else if (clientId) {
          try {
            const c = await getClientById(clientId)
            const mapped = mapClientToForm(c)
            setForm(mapped)
            try {
              const existing = await getClientContacts(clientId)
              const items = existing.map(mapContactToItem)
              setContacts(items)
              setInitialState(JSON.stringify({ form: mapped, contacts: items }))
            } catch {
              setInitialState(JSON.stringify({ form: mapped, contacts: [] }))
            }
          } catch {
            toast.error('Erro ao carregar cliente')
            navigate('/clientes')
          } finally {
            setLoading(false)
          }
        }
      } else {
        setInitialState(JSON.stringify({ form: emptyForm, contacts: [] }))
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

  const addContact = () => {
    savedRef.current = false
    setContacts((prev) => [...prev, { nome: '', email: '', telefone: '' }])
  }

  const updateContact = (index: number, field: keyof ContactItem, value: string) => {
    savedRef.current = false
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
    setErrors((prev) => {
      const key = `contact_${index}_${field}`
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const removeContact = (index: number) => {
    savedRef.current = false
    const removed = contacts[index]
    if (removed?.id) {
      setDeletedContactIds((ids) => [...ids, removed.id!])
    }
    setContacts((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => {
      const next: FieldErrors = {}
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith(`contact_${index}_`)) next[k] = v
      }
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
    if (form.email_principal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_principal.trim())) {
      errs.email_principal = 'E-mail principal inválido'
    }
    contacts.forEach((c, i) => {
      if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
        errs[`contact_${i}_email`] = 'E-mail inválido'
      }
    })
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
        tax_regime: form.tax_regime || null,
        cnae_principal: form.cnae_principal.trim() || null,
        inscricao_estadual: form.inscricao_estadual.trim() || null,
        inscricao_municipal: form.inscricao_municipal.trim() || null,
        ccm: form.ccm.trim() || null,
        natureza_juridica: form.natureza_juridica.trim() || null,
        porte: form.porte.trim() || null,
        data_abertura: form.data_abertura || null,
        situacao_cadastral: form.situacao_cadastral.trim() || null,
        telefone: form.telefone.trim() || null,
        celular: form.celular.trim() || null,
        email_principal: form.email_principal.trim() || null,
        site: form.site.trim() || null,
        client_status: form.client_status || 'Ativo',
        cep: form.cep.trim() || null,
        logradouro: form.logradouro.trim() || null,
        numero: form.numero.trim() || null,
        complemento: form.complemento.trim() || null,
        bairro: form.bairro.trim() || null,
        municipio: form.municipio.trim() || null,
        estado: form.estado.trim() || null,
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

      for (const id of deletedContactIds) {
        try {
          await deleteClientContact(id)
        } catch {
          /* ignore */
        }
      }
      for (const c of contacts) {
        const contactData = {
          client: resultId,
          nome: c.nome.trim(),
          email: c.email.trim(),
          telefone: c.telefone.trim(),
        }
        try {
          if (c.id) {
            await updateClientContact(c.id, contactData)
          } else if (c.nome.trim()) {
            await createClientContact(contactData)
          }
        } catch {
          /* ignore */
        }
      }

      savedRef.current = true
      setDeletedContactIds([])
      setInitialState(JSON.stringify({ form, contacts }))
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
        {/* Seção Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="size-5 text-primary" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => set('code')(e.target.value)}
                  placeholder="Ex: 0001 ou CLI-001"
                  className="font-mono"
                />
                {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label>Regime Tributário *</Label>
                <Select
                  value={form.tax_regime || '__none__'}
                  onValueChange={(v) => set('tax_regime')(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Selecione —</SelectItem>
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
                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                <Input
                  id="inscricao_estadual"
                  value={form.inscricao_estadual}
                  onChange={(e) => set('inscricao_estadual')(e.target.value)}
                  placeholder="Inscrição Estadual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                <Input
                  id="inscricao_municipal"
                  value={form.inscricao_municipal}
                  onChange={(e) => set('inscricao_municipal')(e.target.value)}
                  placeholder="Inscrição Municipal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="natureza_juridica">Natureza Jurídica</Label>
                <Input
                  id="natureza_juridica"
                  value={form.natureza_juridica}
                  onChange={(e) => set('natureza_juridica')(e.target.value)}
                  placeholder="Ex: 206-2 - Sociedade Empresária Limitada"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porte">Porte</Label>
                <Input
                  id="porte"
                  value={form.porte}
                  onChange={(e) => set('porte')(e.target.value)}
                  placeholder="Ex: ME, EPP, Demais"
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

              <div className="space-y-2">
                <Label htmlFor="situacao">Situação Cadastral</Label>
                <Input
                  id="situacao"
                  value={form.situacao_cadastral}
                  onChange={(e) => set('situacao_cadastral')(e.target.value)}
                  placeholder="Ex: Ativa, Baixada, Suspensa"
                />
              </div>

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

        {/* Seção Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="size-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={form.cep}
                  onChange={(e) => set('cep')(e.target.value)}
                  placeholder="00000-000"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={form.logradouro}
                  onChange={(e) => set('logradouro')(e.target.value)}
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={form.numero}
                  onChange={(e) => set('numero')(e.target.value)}
                  placeholder="123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={form.complemento}
                  onChange={(e) => set('complemento')(e.target.value)}
                  placeholder="Sala 402, Bloco B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={form.bairro}
                  onChange={(e) => set('bairro')(e.target.value)}
                  placeholder="Bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  value={form.municipio}
                  onChange={(e) => set('municipio')(e.target.value)}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  value={form.estado}
                  onChange={(e) => set('estado')(e.target.value.toUpperCase())}
                  placeholder="SP"
                  maxLength={2}
                  className="uppercase font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção Contatos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="size-5 text-primary" />
                Contatos
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
                className="gap-1.5"
              >
                <Plus size={14} /> Adicionar Contato
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum contato adicionado. Clique em &quot;Adicionar Contato&quot; para incluir.
              </p>
            ) : (
              contacts.map((contact, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="space-y-2">
                    <Label className="text-xs">Nome do Contato</Label>
                    <Input
                      value={contact.nome}
                      onChange={(e) => updateContact(index, 'nome', e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">E-mail</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, 'email', e.target.value)}
                      placeholder="contato@empresa.com.br"
                    />
                    {errors[`contact_${index}_email`] && (
                      <p className="text-sm text-destructive">{errors[`contact_${index}_email`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Telefone</Label>
                    <Input
                      value={contact.telefone}
                      onChange={(e) => updateContact(index, 'telefone', e.target.value)}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => removeContact(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
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

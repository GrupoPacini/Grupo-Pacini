import { useState, useEffect } from 'react'
import { Client, updateClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { toast } from 'sonner'

const TAX_REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real']
const ONBOARDING_STATUSES = ['Lead', 'Documentação', 'Configuração', 'Ativo']

interface Props {
  client: Client
  canEdit: boolean
  onSuccess: () => void
}

function Field({
  label,
  value,
  canEdit,
  type = 'text',
  onChange,
}: {
  label: string
  value: string
  canEdit: boolean
  type?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {canEdit ? (
        <Input type={type} value={value || ''} onChange={(e) => onChange?.(e.target.value)} />
      ) : (
        <p className="text-sm font-medium text-foreground py-2">{value || '—'}</p>
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  canEdit,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  canEdit: boolean
  onChange?: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {canEdit ? (
        <Select
          value={value || '__none__'}
          onValueChange={(v) => onChange?.(v === '__none__' ? '' : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm font-medium text-foreground py-2">{value || '—'}</p>
      )}
    </div>
  )
}

export function DadosCadastraisTab({ client, canEdit, onSuccess }: Props) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({
      razao_social: client.razao_social || '',
      nome_fantasia: client.nome_fantasia || '',
      cnpj: client.cnpj || '',
      inscricao_estadual: client.inscricao_estadual || '',
      inscricao_municipal: client.inscricao_municipal || '',
      ccm: client.ccm || '',
      natureza_juridica: client.natureza_juridica || '',
      porte: client.porte || '',
      data_abertura: client.data_abertura || '',
      tax_regime: client.tax_regime || '',
      situacao_cadastral: client.situacao_cadastral || '',
      onboarding_status: client.onboarding_status || '',
      cep: client.cep || '',
      logradouro: client.logradouro || '',
      numero: client.numero || '',
      complemento: client.complemento || '',
      bairro: client.bairro || '',
      municipio: client.municipio || '',
      estado: client.estado || '',
      telefone: client.telefone || '',
      celular: client.celular || '',
      whatsapp: client.whatsapp || '',
      email_principal: client.email_principal || '',
      site: client.site || '',
    })
  }, [client])

  const handleSave = async () => {
    setSaving(true)
    setFieldErrors({})
    try {
      await updateClient(client.id, form)
      toast.success('Dados cadastrais atualizados com sucesso')
      onSuccess()
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast.error('Erro ao salvar dados')
    } finally {
      setSaving(false)
    }
  }

  const set = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Razão Social"
              value={form.razao_social}
              canEdit={canEdit}
              onChange={set('razao_social')}
            />
            <Field
              label="Nome Fantasia"
              value={form.nome_fantasia}
              canEdit={canEdit}
              onChange={set('nome_fantasia')}
            />
            <Field label="CNPJ" value={form.cnpj} canEdit={canEdit} onChange={set('cnpj')} />
            <Field
              label="Inscrição Estadual"
              value={form.inscricao_estadual}
              canEdit={canEdit}
              onChange={set('inscricao_estadual')}
            />
            <Field
              label="Inscrição Municipal"
              value={form.inscricao_municipal}
              canEdit={canEdit}
              onChange={set('inscricao_municipal')}
            />
            <Field label="CCM" value={form.ccm} canEdit={canEdit} onChange={set('ccm')} />
            <Field
              label="Natureza Jurídica"
              value={form.natureza_juridica}
              canEdit={canEdit}
              onChange={set('natureza_juridica')}
            />
            <Field label="Porte" value={form.porte} canEdit={canEdit} onChange={set('porte')} />
            <Field
              label="Data de Abertura"
              value={form.data_abertura}
              canEdit={canEdit}
              type="date"
              onChange={set('data_abertura')}
            />
            <SelectField
              label="Regime Tributário"
              value={form.tax_regime}
              options={TAX_REGIMES}
              canEdit={canEdit}
              onChange={set('tax_regime')}
            />
            <Field
              label="Situação Cadastral"
              value={form.situacao_cadastral}
              canEdit={canEdit}
              onChange={set('situacao_cadastral')}
            />
            <SelectField
              label="Status"
              value={form.onboarding_status}
              options={ONBOARDING_STATUSES}
              canEdit={canEdit}
              onChange={set('onboarding_status')}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="CEP" value={form.cep} canEdit={canEdit} onChange={set('cep')} />
            <Field
              label="Logradouro"
              value={form.logradouro}
              canEdit={canEdit}
              onChange={set('logradouro')}
            />
            <Field label="Número" value={form.numero} canEdit={canEdit} onChange={set('numero')} />
            <Field
              label="Complemento"
              value={form.complemento}
              canEdit={canEdit}
              onChange={set('complemento')}
            />
            <Field label="Bairro" value={form.bairro} canEdit={canEdit} onChange={set('bairro')} />
            <Field
              label="Cidade"
              value={form.municipio}
              canEdit={canEdit}
              onChange={set('municipio')}
            />
            <Field label="Estado" value={form.estado} canEdit={canEdit} onChange={set('estado')} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Telefone"
              value={form.telefone}
              canEdit={canEdit}
              onChange={set('telefone')}
            />
            <Field
              label="Celular"
              value={form.celular}
              canEdit={canEdit}
              onChange={set('celular')}
            />
            <Field
              label="WhatsApp"
              value={form.whatsapp}
              canEdit={canEdit}
              onChange={set('whatsapp')}
            />
            <Field
              label="E-mail Principal"
              value={form.email_principal}
              canEdit={canEdit}
              onChange={set('email_principal')}
            />
            <Field label="Site" value={form.site} canEdit={canEdit} onChange={set('site')} />
          </div>
        </CardContent>
      </Card>
      {canEdit && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </div>
  )
}

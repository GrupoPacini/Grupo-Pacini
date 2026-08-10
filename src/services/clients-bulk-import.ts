import * as XLSX from 'xlsx'
import { validateCNPJ, unmaskCNPJ, type ClientRecord } from '@/lib/client-utils'
import pb from '@/lib/pocketbase/client'

export interface ParsedSpreadsheet {
  headers: string[]
  rows: Record<string, unknown>[]
  totalRows: number
}

export interface ComparisonField {
  key: string
  label: string
  currentValue: string
  newValue: string
  changed: boolean
}

export interface ProcessedRow {
  rowIndex: number
  status: 'new' | 'existing' | 'error'
  reason?: string
  mapped: Record<string, string>
  existingClientId?: string
  comparison?: ComparisonField[]
}

export interface ProcessResult {
  rows: ProcessedRow[]
  total: number
  newCount: number
  existingCount: number
  errorCount: number
  invalidCnpjCount: number
  duplicateCodeCount: number
}

export interface ImportError {
  rowIndex: number
  razao_social: string
  cnpj: string
  code: string
  error: string
}

export interface ImportResult {
  imported: number
  updated: number
  kept: number
  failed: number
  errors: ImportError[]
}

export const SYSTEM_FIELDS: readonly { key: string; label: string; required: boolean }[] = [
  { key: 'code', label: 'Código Interno', required: true },
  { key: 'razao_social', label: 'Razão Social', required: true },
  { key: 'nome_fantasia', label: 'Nome Fantasia', required: false },
  { key: 'cnpj', label: 'CNPJ', required: true },
  { key: 'tax_regime', label: 'Regime Tributário', required: false },
  { key: 'inscricao_estadual', label: 'Inscrição Estadual', required: false },
  { key: 'inscricao_municipal', label: 'Inscrição Municipal', required: false },
  { key: 'natureza_juridica', label: 'Natureza Jurídica', required: false },
  { key: 'porte', label: 'Porte', required: false },
  { key: 'data_abertura', label: 'Data de Abertura', required: false },
  { key: 'situacao_cadastral', label: 'Situação Cadastral', required: false },
  { key: 'client_status', label: 'Status do Cliente', required: false },
  { key: 'cep', label: 'CEP', required: false },
  { key: 'logradouro', label: 'Logradouro', required: false },
  { key: 'numero', label: 'Número', required: false },
  { key: 'complemento', label: 'Complemento', required: false },
  { key: 'bairro', label: 'Bairro', required: false },
  { key: 'municipio', label: 'Município', required: false },
  { key: 'estado', label: 'Estado', required: false },
]

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
    reader.readAsDataURL(file)
  })
}

export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Planilha vazia ou sem abas.')
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false }) as Record<
    string,
    unknown
  >[]

  if (!rows || rows.length === 0) {
    throw new Error('Nenhuma linha de dados encontrada.')
  }

  const headers = Object.keys(rows[0])

  return { headers, rows, totalRows: rows.length }
}

export function autoMapColumn(columnName: string): string {
  const normalized = columnName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

  const map: Record<string, string> = {
    codigo: 'code',
    cod: 'code',
    codempresa: 'code',
    codcliente: 'code',
    razaosocial: 'razao_social',
    razao: 'razao_social',
    empresa: 'razao_social',
    nomefantasia: 'nome_fantasia',
    fantasia: 'nome_fantasia',
    cnpj: 'cnpj',
    cnpjcpf: 'cnpj',
    cpfcnpj: 'cnpj',
    regime: 'tax_regime',
    regimetributario: 'tax_regime',
    tributacao: 'tax_regime',
    inscricaoestadual: 'inscricao_estadual',
    ie: 'inscricao_estadual',
    inscricaomunicipal: 'inscricao_municipal',
    im: 'inscricao_municipal',
    natureza: 'natureza_juridica',
    naturezajuridica: 'natureza_juridica',
    porte: 'porte',
    dataabertura: 'data_abertura',
    abertura: 'data_abertura',
    fundacao: 'data_abertura',
    situacao: 'situacao_cadastral',
    situacaocadastral: 'situacao_cadastral',
    status: 'client_status',
    statuscliente: 'client_status',
    cep: 'cep',
    logradouro: 'logradouro',
    rua: 'logradouro',
    endereco: 'logradouro',
    numero: 'numero',
    num: 'numero',
    complemento: 'complemento',
    comp: 'complemento',
    bairro: 'bairro',
    municipio: 'municipio',
    cidade: 'municipio',
    estado: 'estado',
    uf: 'estado',
  }

  return map[normalized] || ''
}

function normalizeTaxRegime(value: string): string | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (v === 'simples nacional' || v === 'simples' || v === 'sn') return 'Simples Nacional'
  if (v === 'lucro presumido' || v === 'presumido' || v === 'lp') return 'Lucro Presumido'
  if (v === 'lucro real' || v === 'real' || v === 'lr') return 'Lucro Real'
  return null
}

function normalizeClientStatus(value: string): string | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (v === 'ativo' || v === 'a' || v === 'active') return 'Ativo'
  if (v === 'inativo' || v === 'i' || v === 'inactive') return 'Inativo'
  return null
}

function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  let m = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  m = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  return null
}

function buildComparison(
  mapped: Record<string, string>,
  existing: ClientRecord,
): ComparisonField[] {
  const result: ComparisonField[] = []
  for (const sf of SYSTEM_FIELDS) {
    const current = String(existing[sf.key] ?? '').trim()
    const newVal = (mapped[sf.key] || '').trim()
    if (!newVal && !current) continue
    result.push({
      key: sf.key,
      label: sf.label,
      currentValue: current || '—',
      newValue: newVal || '—',
      changed: !!newVal && current !== newVal,
    })
  }
  return result
}

export function processRows(
  rawRows: Record<string, unknown>[],
  mapping: Record<string, string>,
  existingClients: ClientRecord[],
): ProcessResult {
  const existingByCnpj = new Map<string, ClientRecord>()
  const existingByCode = new Map<string, ClientRecord>()
  for (const c of existingClients) {
    const cnpj = (c.cnpj || '').replace(/\D/g, '')
    if (cnpj) existingByCnpj.set(cnpj, c)
    const code = (c.code || '').trim().toLowerCase()
    if (code) existingByCode.set(code, c)
  }

  const seenCnpjs = new Map<string, number>()
  const seenCodes = new Map<string, number>()
  const rows: ProcessedRow[] = []
  let newCount = 0,
    existingCount = 0,
    errorCount = 0,
    invalidCnpjCount = 0,
    duplicateCodeCount = 0

  rawRows.forEach((rawRow, index) => {
    const mapped: Record<string, string> = {}
    for (const [col, field] of Object.entries(mapping)) {
      if (field) {
        const value = rawRow[col]
        mapped[field] = value != null ? String(value).trim() : ''
      }
    }

    const cnpj = mapped.cnpj ? unmaskCNPJ(mapped.cnpj) : ''
    const code = (mapped.code || '').trim()
    const razao = (mapped.razao_social || '').trim()
    const errs: string[] = []

    if (!code) errs.push('Código Interno é obrigatório')
    if (!razao) errs.push('Razão Social é obrigatória')
    if (!cnpj) {
      errs.push('CNPJ é obrigatório')
    } else if (cnpj.length !== 14) {
      errs.push('CNPJ deve ter 14 dígitos')
      invalidCnpjCount++
    } else if (!validateCNPJ(cnpj)) {
      errs.push('CNPJ inválido')
      invalidCnpjCount++
    }
    if (cnpj) mapped.cnpj = cnpj

    if (mapped.data_abertura) {
      const parsed = parseDate(mapped.data_abertura)
      if (!parsed) {
        errs.push('Data de Abertura inválida')
      } else {
        mapped.data_abertura = parsed
      }
    }
    if (mapped.tax_regime) {
      const norm = normalizeTaxRegime(mapped.tax_regime)
      if (!norm) {
        errs.push('Regime Tributário inválido')
      } else {
        mapped.tax_regime = norm
      }
    }
    if (mapped.client_status) {
      const norm = normalizeClientStatus(mapped.client_status)
      if (!norm) {
        errs.push('Status do Cliente inválido')
      } else {
        mapped.client_status = norm
      }
    }

    if (cnpj) {
      if (seenCnpjs.has(cnpj)) {
        errs.push(`CNPJ duplicado na planilha (linha ${seenCnpjs.get(cnpj)! + 1})`)
      } else {
        seenCnpjs.set(cnpj, index)
      }
    }
    if (code) {
      const cl = code.toLowerCase()
      if (seenCodes.has(cl)) {
        errs.push(`Código duplicado na planilha (linha ${seenCodes.get(cl)! + 1})`)
        duplicateCodeCount++
      } else {
        seenCodes.set(cl, index)
      }
    }

    let existingClient: ClientRecord | undefined
    if (cnpj && existingByCnpj.has(cnpj)) existingClient = existingByCnpj.get(cnpj)
    if (!existingClient && code && existingByCode.has(code.toLowerCase())) {
      existingClient = existingByCode.get(code.toLowerCase())
    }

    let status: 'new' | 'existing' | 'error'
    let reason: string | undefined
    let existingClientId: string | undefined
    let comparison: ComparisonField[] | undefined

    if (errs.length > 0) {
      status = 'error'
      reason = errs.join('; ')
      errorCount++
    } else if (existingClient) {
      status = 'existing'
      reason = 'Cliente já cadastrado'
      existingClientId = existingClient.id
      comparison = buildComparison(mapped, existingClient)
      existingCount++
    } else {
      status = 'new'
      newCount++
    }

    rows.push({ rowIndex: index, status, reason, mapped, existingClientId, comparison })
  })

  return {
    rows,
    total: rawRows.length,
    newCount,
    existingCount,
    errorCount,
    invalidCnpjCount,
    duplicateCodeCount,
  }
}

function buildPayload(mapped: Record<string, string>): Record<string, unknown> {
  const razao = mapped.razao_social?.trim() || ''
  const fantasia = mapped.nome_fantasia?.trim() || ''
  return {
    name: razao,
    razao_social: razao,
    nome_fantasia: fantasia,
    alias: fantasia,
    cnpj: mapped.cnpj ? unmaskCNPJ(mapped.cnpj) : '',
    code: mapped.code?.trim() || '',
    client_status: mapped.client_status || 'Ativo',
    tax_regime: mapped.tax_regime || null,
    inscricao_estadual: mapped.inscricao_estadual?.trim() || null,
    inscricao_municipal: mapped.inscricao_municipal?.trim() || null,
    natureza_juridica: mapped.natureza_juridica?.trim() || null,
    porte: mapped.porte?.trim() || null,
    data_abertura: mapped.data_abertura || null,
    situacao_cadastral: mapped.situacao_cadastral?.trim() || null,
    cep: mapped.cep?.trim() || null,
    logradouro: mapped.logradouro?.trim() || null,
    numero: mapped.numero?.trim() || null,
    complemento: mapped.complemento?.trim() || null,
    bairro: mapped.bairro?.trim() || null,
    municipio: mapped.municipio?.trim() || null,
    estado: mapped.estado?.trim() || null,
  }
}

function buildUpdatePayload(
  mapped: Record<string, string>,
  existing: ClientRecord,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  const razao = mapped.razao_social?.trim()
  const fantasia = mapped.nome_fantasia?.trim()
  const cnpj = mapped.cnpj ? unmaskCNPJ(mapped.cnpj) : ''
  const code = mapped.code?.trim()

  if (razao && razao !== String(existing.razao_social ?? '').trim()) {
    payload.name = razao
    payload.razao_social = razao
  }
  if (fantasia && fantasia !== String(existing.nome_fantasia ?? '').trim()) {
    payload.nome_fantasia = fantasia
    payload.alias = fantasia
  }
  if (cnpj && cnpj !== String(existing.cnpj ?? '').replace(/\D/g, '')) {
    payload.cnpj = cnpj
  }
  if (code && code !== String(existing.code ?? '').trim()) {
    payload.code = code
  }
  if (mapped.client_status && mapped.client_status !== String(existing.client_status ?? '')) {
    payload.client_status = mapped.client_status
  }
  if (mapped.tax_regime && mapped.tax_regime !== String(existing.tax_regime ?? '')) {
    payload.tax_regime = mapped.tax_regime
  }
  if (
    mapped.inscricao_estadual?.trim() &&
    mapped.inscricao_estadual.trim() !== String(existing.inscricao_estadual ?? '').trim()
  ) {
    payload.inscricao_estadual = mapped.inscricao_estadual.trim()
  }
  if (
    mapped.inscricao_municipal?.trim() &&
    mapped.inscricao_municipal.trim() !== String(existing.inscricao_municipal ?? '').trim()
  ) {
    payload.inscricao_municipal = mapped.inscricao_municipal.trim()
  }
  if (
    mapped.natureza_juridica?.trim() &&
    mapped.natureza_juridica.trim() !== String(existing.natureza_juridica ?? '').trim()
  ) {
    payload.natureza_juridica = mapped.natureza_juridica.trim()
  }
  if (mapped.porte?.trim() && mapped.porte.trim() !== String(existing.porte ?? '').trim()) {
    payload.porte = mapped.porte.trim()
  }
  if (
    mapped.data_abertura &&
    mapped.data_abertura !== String(existing.data_abertura ?? '').slice(0, 10)
  ) {
    payload.data_abertura = mapped.data_abertura
  }
  if (
    mapped.situacao_cadastral?.trim() &&
    mapped.situacao_cadastral.trim() !== String(existing.situacao_cadastral ?? '').trim()
  ) {
    payload.situacao_cadastral = mapped.situacao_cadastral.trim()
  }
  if (mapped.cep?.trim() && mapped.cep.trim() !== String(existing.cep ?? '').trim()) {
    payload.cep = mapped.cep.trim()
  }
  if (
    mapped.logradouro?.trim() &&
    mapped.logradouro.trim() !== String(existing.logradouro ?? '').trim()
  ) {
    payload.logradouro = mapped.logradouro.trim()
  }
  if (mapped.numero?.trim() && mapped.numero.trim() !== String(existing.numero ?? '').trim()) {
    payload.numero = mapped.numero.trim()
  }
  if (
    mapped.complemento?.trim() &&
    mapped.complemento.trim() !== String(existing.complemento ?? '').trim()
  ) {
    payload.complemento = mapped.complemento.trim()
  }
  if (mapped.bairro?.trim() && mapped.bairro.trim() !== String(existing.bairro ?? '').trim()) {
    payload.bairro = mapped.bairro.trim()
  }
  if (
    mapped.municipio?.trim() &&
    mapped.municipio.trim() !== String(existing.municipio ?? '').trim()
  ) {
    payload.municipio = mapped.municipio.trim()
  }
  if (mapped.estado?.trim() && mapped.estado.trim() !== String(existing.estado ?? '').trim()) {
    payload.estado = mapped.estado.trim()
  }
  return payload
}

export async function importClients(
  newRows: ProcessedRow[],
  onProgress?: (current: number, total: number) => void,
): Promise<ImportResult> {
  let imported = 0
  let failed = 0
  const errors: ImportError[] = []

  for (let i = 0; i < newRows.length; i++) {
    const row = newRows[i]
    try {
      await pb.collection('clients').create(buildPayload(row.mapped))
      imported++
    } catch (err: any) {
      failed++
      const errMsg = err?.response?.data
        ? Object.values(err.response.data)
            .map((v: any) => v?.message || '')
            .filter(Boolean)
            .join('; ')
        : err?.message || 'Erro desconhecido'
      errors.push({
        rowIndex: row.rowIndex + 1,
        razao_social: row.mapped.razao_social || '',
        cnpj: row.mapped.cnpj || '',
        code: row.mapped.code || '',
        error: errMsg,
      })
    }
    onProgress?.(i + 1, newRows.length)
  }

  return { imported, updated: 0, kept: 0, failed, errors }
}

export async function updateClients(
  rows: ProcessedRow[],
  existingClients: ClientRecord[],
  onProgress?: (current: number, total: number) => void,
): Promise<ImportResult> {
  const clientMap = new Map(existingClients.map((c) => [c.id, c]))
  const allCnpjs = new Set<string>()
  const allCodes = new Set<string>()
  for (const c of existingClients) {
    const cnpj = (c.cnpj || '').replace(/\D/g, '')
    if (cnpj) allCnpjs.add(cnpj)
    const code = (c.code || '').trim().toLowerCase()
    if (code) allCodes.add(code)
  }

  let updated = 0
  let noChange = 0
  let failed = 0
  const errors: ImportError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const existing = row.existingClientId ? clientMap.get(row.existingClientId) : undefined
    if (!existing) {
      failed++
      errors.push({
        rowIndex: row.rowIndex + 1,
        razao_social: row.mapped.razao_social || '',
        cnpj: row.mapped.cnpj || '',
        code: row.mapped.code || '',
        error: 'Cliente não encontrado no banco de dados',
      })
      onProgress?.(i + 1, rows.length)
      continue
    }

    const payload = buildUpdatePayload(row.mapped, existing)
    if (Object.keys(payload).length === 0) {
      noChange++
      onProgress?.(i + 1, rows.length)
      continue
    }

    if (payload.cnpj) {
      const existingCnpj = String(existing.cnpj || '').replace(/\D/g, '')
      if (payload.cnpj !== existingCnpj && allCnpjs.has(payload.cnpj as string)) {
        failed++
        errors.push({
          rowIndex: row.rowIndex + 1,
          razao_social: row.mapped.razao_social || '',
          cnpj: row.mapped.cnpj || '',
          code: row.mapped.code || '',
          error: 'CNPJ conflita com outro cliente existente',
        })
        onProgress?.(i + 1, rows.length)
        continue
      }
    }
    if (payload.code) {
      const codeLower = String(payload.code).toLowerCase()
      const existingCodeLower = String(existing.code || '')
        .trim()
        .toLowerCase()
      if (codeLower !== existingCodeLower && allCodes.has(codeLower)) {
        failed++
        errors.push({
          rowIndex: row.rowIndex + 1,
          razao_social: row.mapped.razao_social || '',
          cnpj: row.mapped.cnpj || '',
          code: row.mapped.code || '',
          error: 'Código Interno conflita com outro cliente existente',
        })
        onProgress?.(i + 1, rows.length)
        continue
      }
    }

    try {
      await pb.collection('clients').update(existing.id, payload)
      updated++
    } catch (err: any) {
      failed++
      const errMsg = err?.response?.data
        ? Object.values(err.response.data)
            .map((v: any) => v?.message || '')
            .filter(Boolean)
            .join('; ')
        : err?.message || 'Erro desconhecido'
      errors.push({
        rowIndex: row.rowIndex + 1,
        razao_social: row.mapped.razao_social || '',
        cnpj: row.mapped.cnpj || '',
        code: row.mapped.code || '',
        error: errMsg,
      })
    }
    onProgress?.(i + 1, rows.length)
  }

  return { imported: 0, updated, kept: noChange, failed, errors }
}

export function downloadErrorCSV(errors: ImportError[]) {
  const headers = ['Linha', 'Razao Social', 'CNPJ', 'Codigo', 'Erro']
  const lines = [headers.join(',')]
  for (const e of errors) {
    lines.push(
      [
        String(e.rowIndex),
        `"${(e.razao_social || '').replace(/"/g, '""')}"`,
        `"${(e.cnpj || '').replace(/"/g, '""')}"`,
        `"${(e.code || '').replace(/"/g, '""')}"`,
        `"${(e.error || '').replace(/"/g, '""')}"`,
      ].join(','),
    )
  }
  const csv = '\uFEFF' + lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'erros_importacao_clientes.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

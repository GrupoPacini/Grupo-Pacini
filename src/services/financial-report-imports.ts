import pb from '@/lib/pocketbase/client'

export interface ImportReportPayload {
  client: string
  month: number
  year: number
  fileData: string
  fileName: string
  fileType: string
  notes?: string
  replace?: boolean
  openingBalance?: number | null
}

export interface FinancialReportImport {
  id: string
  client: string
  month: number
  year: number
  file_name: string
  file_type: string
  status: 'importando' | 'importacao_concluida' | 'erro_importacao' | 'arquivo_invalido'
  imported_by?: string
  imported_at?: string
  notes?: string
  record_count?: number
  opening_balance?: number | null
  created?: string
  updated?: string
}

export async function importFinancialReport(payload: ImportReportPayload) {
  return pb.send('/backend/v1/financial-reports/import', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function getImportedReports(clientId?: string) {
  const filter = clientId ? `client = "${clientId}"` : ''
  return pb.collection('financial_report_imports').getFullList({
    filter,
    sort: '-imported_at',
  })
}

export async function getImportReport(id: string) {
  return pb.collection('financial_report_imports').getOne(id)
}

export async function deleteImportReport(id: string) {
  return pb.send(`/backend/v1/financial-reports/${id}`, {
    method: 'DELETE',
  })
}

export async function updateOpeningBalance(id: string, openingBalance: number) {
  return pb.send(`/backend/v1/financial-reports/${id}/opening-balance`, {
    method: 'PATCH',
    body: JSON.stringify({ openingBalance }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

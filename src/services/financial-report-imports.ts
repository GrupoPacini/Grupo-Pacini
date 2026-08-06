import pb from '@/lib/pocketbase/client'

export interface FinancialReportImport {
  id: string
  client: string
  month: number
  year: number
  file_name: string
  file_type: string
  status: 'importando' | 'importacao_concluida' | 'erro_importacao' | 'arquivo_invalido'
  imported_by: string
  imported_at: string
  notes: string
  record_count: number
  created: string
  updated: string
  expand?: {
    client?: { id: string; name: string; razao_social: string; nome_fantasia: string }
    imported_by?: { id: string; name: string }
  }
}

export async function getFinancialReportImports(): Promise<FinancialReportImport[]> {
  return (await pb.collection('financial_report_imports').getFullList({
    sort: '-imported_at',
    expand: 'client,imported_by',
  })) as unknown as FinancialReportImport[]
}

export async function checkDuplicateImport(
  clientId: string,
  month: number,
  year: number,
): Promise<FinancialReportImport | null> {
  const results = (await pb.collection('financial_report_imports').getFullList({
    filter: `client = "${clientId}" && month = ${month} && year = ${year} && status = "importacao_concluida"`,
  })) as unknown as FinancialReportImport[]
  return results.length > 0 ? results[0] : null
}

export async function importFinancialReport(data: {
  client: string
  month: number
  year: number
  notes?: string
  replace?: boolean
  fileName: string
  fileType: string
  fileData: string
}): Promise<{ success: boolean; id: string; record_count: number }> {
  return await pb.send('/backend/v1/financial-reports/import', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function deleteFinancialReportImport(
  id: string,
): Promise<{ success: boolean; deletedRecords: number }> {
  return await pb.send(`/backend/v1/financial-reports/${id}`, {
    method: 'DELETE',
  })
}

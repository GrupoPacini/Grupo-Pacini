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
}

export const importFinancialReport = (data: ImportReportPayload) =>
  pb.send('/backend/v1/financial-reports/import', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

export const getImportedReports = (clientId?: string) => {
  const params: Record<string, any> = { sort: '-created' }
  if (clientId) params.filter = `client = "${clientId}"`
  return pb.collection('financial_report_imports').getFullList(params)
}

export const getImportReport = (id: string) => pb.collection('financial_report_imports').getOne(id)

export const deleteImportReport = (id: string) =>
  pb.collection('financial_report_imports').delete(id)

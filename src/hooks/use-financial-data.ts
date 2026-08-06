import { useState, useEffect, useCallback } from 'react'
import { getAllClientsForIndicators, type ClientRecord } from '@/services/clients'
import {
  getFinancialTransactions,
  type FinancialTransaction,
  type FinancialFilterOptions,
} from '@/services/financial-transactions'
import { getImportedReports, type FinancialReportImport } from '@/services/financial-report-imports'
import { useRealtime } from '@/hooks/use-realtime'

export interface FinancialFilters {
  cliente: string
  mes: string
  ano: string
  categoria: string
  conta: string
  projeto: string
}

export const EMPTY_FILTERS: FinancialFilters = {
  cliente: 'all',
  mes: 'all',
  ano: 'all',
  categoria: 'Todas',
  conta: 'Todas',
  projeto: 'Todos',
}

export function useFinancialData(appliedFilters: FinancialFilters) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([])
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [imports, setImports] = useState<FinancialReportImport[]>([])

  const refreshImports = useCallback(async () => {
    try {
      const data = await getImportedReports()
      setImports(data)
    } catch {
      /* noop */
    }
  }, [])

  useEffect(() => {
    getAllClientsForIndicators()
      .then(setClients)
      .catch(() => {})
    refreshImports()
    getFinancialTransactions()
      .then(setAllTransactions)
      .catch(() => {})
  }, [refreshImports])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const hasCompetence =
        appliedFilters.cliente !== 'all' &&
        appliedFilters.mes !== 'all' &&
        appliedFilters.ano !== 'all'

      let data: FinancialTransaction[]
      if (hasCompetence) {
        const matchingImport = imports.find(
          (imp) =>
            imp.client === appliedFilters.cliente &&
            imp.month === parseInt(appliedFilters.mes, 10) &&
            imp.year === parseInt(appliedFilters.ano, 10) &&
            imp.status === 'importacao_concluida',
        )
        if (matchingImport) {
          const opts: FinancialFilterOptions = {
            financialReportImport: matchingImport.id,
            category: appliedFilters.categoria,
            account: appliedFilters.conta,
            project: appliedFilters.projeto,
          }
          data = await getFinancialTransactions(opts)
        } else {
          data = []
        }
      } else {
        const opts: FinancialFilterOptions = {
          client: appliedFilters.cliente !== 'all' ? appliedFilters.cliente : undefined,
          month: appliedFilters.mes !== 'all' ? appliedFilters.mes : undefined,
          year: appliedFilters.ano !== 'all' ? appliedFilters.ano : undefined,
          category: appliedFilters.categoria,
          account: appliedFilters.conta,
          project: appliedFilters.projeto,
        }
        data = await getFinancialTransactions(opts)
      }
      setTransactions(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, imports])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('financial_transactions', () => {
    loadData()
    getFinancialTransactions()
      .then(setAllTransactions)
      .catch(() => {})
  })

  useRealtime('financial_report_imports', () => {
    refreshImports()
  })

  return {
    loading,
    error,
    transactions,
    allTransactions,
    clients,
    imports,
    retry: loadData,
    refreshImports,
  }
}

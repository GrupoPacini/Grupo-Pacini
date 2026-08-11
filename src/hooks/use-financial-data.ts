import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import type { FinancialReportImport } from '@/services/financial-report-imports'
import type { Transaction } from '@/lib/financial-utils'
import type { Client } from '@/services/api'

export interface FinancialFilters {
  cliente: string
  mes: string[]
  ano: string
  categoria: string
  conta: string
  projeto: string
}

export const EMPTY_FILTERS: FinancialFilters = {
  cliente: 'all',
  mes: ['all'],
  ano: 'all',
  categoria: 'all',
  conta: 'all',
  projeto: 'all',
}

export function useFinancialData(
  filters: FinancialFilters,
  options?: { isCliente?: boolean; clientId?: string | null },
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [clientAllTransactions, setClientAllTransactions] = useState<Transaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [imports, setImports] = useState<FinancialReportImport[]>([])

  const isClienteUser = options?.isCliente ?? false
  const lockedClientId = options?.clientId ?? null

  useEffect(() => {
    let active = true
    if (isClienteUser && lockedClientId) {
      pb.collection('clients')
        .getOne(lockedClientId)
        .then((data) => {
          if (active) setClients([data as unknown as Client])
        })
        .catch(() => {
          if (active) setClients([])
        })
    } else {
      pb.collection('clients')
        .getFullList({ sort: 'name,razao_social' })
        .then((data) => {
          if (active) setClients(data as unknown as Client[])
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [isClienteUser, lockedClientId])

  const fetchData = useCallback(async () => {
    const effectiveClient = isClienteUser && lockedClientId ? lockedClientId : filters.cliente
    if (!effectiveClient || effectiveClient === 'all') {
      setTransactions([])
      setAllTransactions([])
      setClientAllTransactions([])
      setImports([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const filterParts: string[] = [`client = "${effectiveClient}"`]

      const isAllMonths = filters.mes.includes('all') || filters.mes.length === 0
      const selectedMonths = filters.mes.filter((m) => m !== 'all')

      if (!isAllMonths && filters.ano !== 'all' && selectedMonths.length > 0) {
        const y = filters.ano
        const monthFilters = selectedMonths.map((m) => {
          const mm = String(m).padStart(2, '0')
          const lastDay = new Date(Number(y), Number(m), 0).getDate()
          return `date >= "${y}-${mm}-01 00:00:00" && date <= "${y}-${mm}-${String(lastDay).padStart(2, '0')} 23:59:59"`
        })
        filterParts.push(`(${monthFilters.join(' || ')})`)
      } else if (filters.ano !== 'all') {
        filterParts.push(`date >= "${filters.ano}-01-01 00:00:00"`)
        filterParts.push(`date <= "${filters.ano}-12-31 23:59:59"`)
      }

      const txFilterStr = filterParts.join(' && ')

      const txRecords = await pb.collection('financial_transactions').getFullList({
        filter: txFilterStr,
        sort: '-date',
      })

      const mappedTx: Transaction[] = txRecords.map((r: any) => ({
        id: r.id,
        client: r.client,
        date: r.date,
        description: r.description || '',
        category: r.category || 'Sem Categoria',
        account: r.account || 'Principal',
        project: r.project || 'Geral',
        type: r.type as 'Receita' | 'Despesa',
        value: Number(r.value) || 0,
        status: r.status as 'Pago' | 'Pendente' | 'Atrasado',
        financial_report_import: r.financial_report_import,
      }))

      setAllTransactions(mappedTx)

      let filtered = mappedTx
      if (filters.categoria !== 'all') {
        filtered = filtered.filter((t) => t.category === filters.categoria)
      }
      if (filters.conta !== 'all') {
        filtered = filtered.filter((t) => t.account === filters.conta)
      }
      if (filters.projeto !== 'all') {
        filtered = filtered.filter((t) => t.project === filters.projeto)
      }

      setTransactions(filtered)

      const importRecords = await pb.collection('financial_report_imports').getFullList({
        filter: `client = "${effectiveClient}"`,
        sort: '-imported_at',
        expand: 'client,imported_by',
      })
      setImports(importRecords as unknown as FinancialReportImport[])

      const allClientTxRecords = await pb.collection('financial_transactions').getFullList({
        filter: `client = "${effectiveClient}"`,
        sort: 'date',
      })
      const allClientTx: Transaction[] = allClientTxRecords.map((r: any) => ({
        id: r.id,
        client: r.client,
        date: r.date,
        description: r.description || '',
        category: r.category || 'Sem Categoria',
        account: r.account || 'Principal',
        project: r.project || 'Geral',
        type: r.type as 'Receita' | 'Despesa',
        value: Number(r.value) || 0,
        status: r.status as 'Pago' | 'Pendente' | 'Atrasado',
        financial_report_import: r.financial_report_import,
      }))
      setClientAllTransactions(allClientTx)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [
    filters.cliente,
    filters.mes,
    filters.ano,
    filters.categoria,
    filters.conta,
    filters.projeto,
    isClienteUser,
    lockedClientId,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshImports = useCallback(async () => {
    const effectiveClient = isClienteUser && lockedClientId ? lockedClientId : filters.cliente
    if (!effectiveClient || effectiveClient === 'all') {
      setImports([])
      return
    }
    try {
      const records = await pb.collection('financial_report_imports').getFullList({
        filter: `client = "${effectiveClient}"`,
        sort: '-imported_at',
        expand: 'client,imported_by',
      })
      setImports(records as unknown as FinancialReportImport[])
    } catch {
      /* intentionally ignored */
    }
  }, [filters.cliente, isClienteUser, lockedClientId])

  useRealtime('financial_transactions', () => fetchData())
  useRealtime('financial_report_imports', () => refreshImports())

  return {
    loading,
    error,
    transactions,
    allTransactions,
    clients,
    imports,
    retry: fetchData,
    refreshImports,
    clientAllTransactions,
  }
}

import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { FinancialReportImport } from '@/services/financial-report-imports'
import type { Transaction } from '@/lib/financial-utils'
import type { Client } from '@/services/api'

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
  categoria: 'all',
  conta: 'all',
  projeto: 'all',
}

export function useFinancialData(filters: FinancialFilters) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [imports, setImports] = useState<FinancialReportImport[]>([])

  useEffect(() => {
    let active = true
    pb.collection('clients')
      .getFullList({ sort: 'name,razao_social' })
      .then((data) => {
        if (active) setClients(data as unknown as Client[])
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!filters.cliente || filters.cliente === 'all') {
      setTransactions([])
      setAllTransactions([])
      setImports([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const filterParts: string[] = [`client = "${filters.cliente}"`]

      if (filters.mes !== 'all' && filters.ano !== 'all') {
        const m = String(filters.mes).padStart(2, '0')
        const y = filters.ano
        const lastDay = new Date(Number(y), Number(m), 0).getDate()
        filterParts.push(`date >= "${y}-${m}-01 00:00:00"`)
        filterParts.push(`date <= "${y}-${m}-${String(lastDay).padStart(2, '0')} 23:59:59"`)
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
        filter: `client = "${filters.cliente}"`,
        sort: '-imported_at',
      })
      setImports(importRecords as unknown as FinancialReportImport[])
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [filters.cliente, filters.mes, filters.ano, filters.categoria, filters.conta, filters.projeto])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshImports = useCallback(async () => {
    if (!filters.cliente || filters.cliente === 'all') {
      setImports([])
      return
    }
    try {
      const records = await pb.collection('financial_report_imports').getFullList({
        filter: `client = "${filters.cliente}"`,
        sort: '-imported_at',
      })
      setImports(records as unknown as FinancialReportImport[])
    } catch {
      /* intentionally ignored */
    }
  }, [filters.cliente])

  return {
    loading,
    error,
    transactions,
    allTransactions,
    clients,
    imports,
    retry: fetchData,
    refreshImports,
  }
}

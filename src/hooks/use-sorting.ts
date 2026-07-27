import { useState, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export function useSorting() {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const toggleSort = useCallback((field: string) => {
    setSortField((prevField) => {
      if (prevField !== field) {
        setSortDirection('asc')
        return field
      }
      setSortDirection((prevDir) => {
        if (prevDir === 'asc') return 'desc'
        if (prevDir === 'desc') return null
        return 'asc'
      })
      return prevField
    })
  }, [])

  return { sortField, sortDirection, toggleSort }
}

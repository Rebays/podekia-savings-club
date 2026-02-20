"use client"

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'

interface Contribution {
  fortnight: number
  date: string | null
  shares: number | null
  social_fund: number | null
  late_fee: number | null
  absent_fee: number | null
  notes: string | null
}

interface Props {
  contributions: Contribution[] | null
}

export function ContributionsTable({ contributions }: Props) {
  const hasData = contributions && contributions.length > 0

  const csvContent = useMemo(() => {
    if (!hasData) return ''

    const headers = ['Fortnight', 'Date', 'Shares', 'Social Fund', 'Late Fee', 'Absent Fee', 'Notes']
    const rows = contributions.map(row => [
      row.fortnight,
      row.date || '',
      row.shares ?? 0,
      row.social_fund ?? 0,
      row.late_fee ?? 0,
      row.absent_fee ?? 0,
      `"${(row.notes || '').replace(/"/g, '""')}"`, // escape quotes
    ])

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
  }, [contributions, hasData])

  const handleExport = () => {
    if (!hasData) return

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `contributions-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      {hasData && (
        <div className="z-50 pb-6 flex justify-end pr-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-16">FN</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Social</TableHead>
              <TableHead className="text-right">Late</TableHead>
              <TableHead className="text-right">Absent</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions?.map((row) => (
              <TableRow key={row.fortnight} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{row.fortnight}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.date || '—'}
                </TableCell>
                <TableCell className="text-right">{row.shares ?? 0}</TableCell>
                <TableCell className="text-right text-emerald-400">
                  {row.social_fund ?? 0}
                </TableCell>
                <TableCell className="text-right text-red-400">
                  {row.late_fee ?? 0}
                </TableCell>
                <TableCell className="text-right text-red-400">
                  {row.absent_fee ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {row.notes || '—'}
                </TableCell>
              </TableRow>
            ))}

            {!hasData && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No contributions recorded yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
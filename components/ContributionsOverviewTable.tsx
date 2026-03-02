"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Download } from "lucide-react"

interface MemberContribution {
  id: string
  full_name: string | null
  shares: number
  social_fund: number
  outstanding: number
  total: number
}

interface GrandTotals {
  shares: number
  social_fund: number
  outstanding: number
  total: number
}

interface Props {
  members: MemberContribution[]
  grandTotals: GrandTotals
}

export function ContributionsOverviewTable({ members, grandTotals }: Props) {
  const hasData = members.length > 0

  const csvContent = useMemo(() => {
    if (!hasData) return ""

    const headers = ["Member Name", "Shares", "Social Fund", "Outstanding", "Total"]

    const rows = members.map(m => [
      `"${(m.full_name || "Unknown").replace(/"/g, '""')}"`,
      m.shares,
      m.social_fund,
      m.outstanding,
      m.total,
    ])

    // Add grand totals row
    const grandRow = ["GRAND TOTAL", grandTotals.shares, grandTotals.social_fund, grandTotals.outstanding, grandTotals.total]

    return [headers, ...rows, grandRow]
      .map(row => row.join(","))
      .join("\n")
  }, [members, grandTotals, hasData])

  const handleExport = () => {
    if (!hasData) return

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `club-contributions-${new Date().toISOString().split("T")[0]}.csv`)
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
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Social Fund</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right font-semibold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{m.full_name || "—"}</TableCell>
                <TableCell className="text-right">{m.shares.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-400">
                  {m.social_fund.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-red-400">
                  {m.outstanding.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {m.total.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}

            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No members or contributions yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="bg-muted/50">
            <TableRow>
              <TableCell className="font-bold">GRAND TOTAL</TableCell>
              <TableCell className="text-right font-bold">{grandTotals.shares.toLocaleString()}</TableCell>
              <TableCell className="text-right font-bold text-emerald-400">
                {grandTotals.social_fund.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-bold text-red-400">
                {grandTotals.outstanding.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-bold text-cyan-300">
                {grandTotals.total.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
// app/ledger/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'

export default async function LedgerPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch all contributions for this user
  const { data: contributions, error } = await supabase
    .from('Contributions')
    .select('fortnight, date, shares, social_fund, late_fee, absent_fee, notes')
    .eq('member_id', user.id)
    .order('fortnight', { ascending: true })

  if (error) {
    console.error('Error fetching ledger:', error)
    return (
      <div className="min-h-screen bg-background p-8 text-red-400">
        Error loading ledger data
      </div>
    )
  }

  // Calculate row totals + running cumulative
  let cumulative = 0
  const ledgerRows = contributions?.map((row) => {
    const rowTotal =
      (row.shares ?? 0) +
      (row.social_fund ?? 0) +
      (row.late_fee ?? 0) +
      (row.absent_fee ?? 0)

    cumulative += rowTotal

    return {
      ...row,
      rowTotal,
      cumulative,
    }
  }) ?? []

  const grandTotal = cumulative

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content - offset for sidebar on desktop */}
      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Personal Ledger
              </h1>
              <p className="text-muted-foreground mt-1">
                Detailed contribution history • {user.email}
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm">
              Member View
            </Badge>
          </div>

          <Separator className="my-6" />

          {/* Grand Total Hero Card */}
          <Card className="bg-gradient-to-br from-card to-muted/40 border-border/50 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-muted-foreground">
                Lifetime Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-center md:text-left">
                {grandTotal.toLocaleString()}
              </p>
              <p className="text-lg text-muted-foreground mt-2 text-center md:text-left">
                SBD equivalent • All fortnights combined
              </p>
            </CardContent>
          </Card>

          {/* Detailed Ledger Table */}
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl">Fortnight-by-Fortnight Ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-16">FN</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Social Fund</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead className="text-right">Absent Fee</TableHead>
                      <TableHead className="text-right font-semibold">Row Total</TableHead>
                      <TableHead className="text-right font-bold">Cumulative</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerRows.map((row) => (
                      <TableRow key={row.fortnight} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{row.fortnight}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.date || '—'}
                        </TableCell>
                        <TableCell className="text-right">{row.shares || 0}</TableCell>
                        <TableCell className="text-right text-emerald-400">
                          {row.social_fund || 0}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          {row.late_fee || 0}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          {row.absent_fee || 0}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {row.rowTotal}
                        </TableCell>
                        <TableCell className="text-right font-bold text-cyan-300">
                          {row.cumulative}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {row.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}

                    {ledgerRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                          No contributions recorded yet.<br />
                          <span className="text-sm mt-2 block">
                            Your transaction history will appear here once entries are added.
                          </span>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-8">
            Ledger • Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
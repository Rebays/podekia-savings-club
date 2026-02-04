// app/dashboard/admin/contributions-overview/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'

export default async function AdminContributionsOverview() {
  const supabase = await createSupabaseServerClient(true) // true = service_role key

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // if (profile?.role !== 'admin') {
  //   return (
  //     <div className="min-h-screen bg-background p-8 text-center">
  //       <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
  //       <p className="mt-4 text-muted-foreground">Only administrators can access this page.</p>
  //     </div>
  //   )
  // }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  // Fetch contributions grouped by member with per-field totals
  const { data: contributions } = await supabase
    .from('contributions')
    .select('member_id, shares, social_fund, late_fee, absent_fee')

  // Calculate per-member totals
  const memberBalances: Record<string, {
    shares: number
    social_fund: number
    late_fee: number
    absent_fee: number
    total: number
  }> = {}

  contributions?.forEach(row => {
    if (!memberBalances[row.member_id]) {
      memberBalances[row.member_id] = { shares: 0, social_fund: 0, late_fee: 0, absent_fee: 0, total: 0 }
    }
    memberBalances[row.member_id].shares += row.shares ?? 0
    memberBalances[row.member_id].social_fund += row.social_fund ?? 0
    memberBalances[row.member_id].late_fee += row.late_fee ?? 0
    memberBalances[row.member_id].absent_fee += row.absent_fee ?? 0
    memberBalances[row.member_id].total +=
      (row.shares ?? 0) + (row.social_fund ?? 0) + (row.late_fee ?? 0) + (row.absent_fee ?? 0)
  })

  // Combine profiles with balances
  const members = profiles?.map(p => {
    const balance = memberBalances[p.id] || { shares: 0, social_fund: 0, late_fee: 0, absent_fee: 0, total: 0 }
    return {
      ...p,
      ...balance,
    }
  }) ?? []

  // Grand totals across all members
  const grandTotals = members.reduce(
    (acc, m) => ({
      shares: acc.shares + m.shares,
      social_fund: acc.social_fund + m.social_fund,
      late_fee: acc.late_fee + m.late_fee,
      absent_fee: acc.absent_fee + m.absent_fee,
      total: acc.total + m.total,
    }),
    { shares: 0, social_fund: 0, late_fee: 0, absent_fee: 0, total: 0 }
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Contributions Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                {members.length} members • Club grand total: {grandTotals.total.toLocaleString()}
              </p>
            </div>
          </div>

          <Card className="border-border/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-linear-to-r from-muted/50 to-background border-b border-border/50">
              <CardTitle className="text-xl">Member Contributions Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Shares</TableHead>
                      <TableHead className="text-right">Social Fund</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead className="text-right">Absent Fee</TableHead>
                      <TableHead className="text-right font-semibold">Row Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{m.full_name || '—'}</TableCell>
                        <TableCell className="text-right">{m.shares.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-emerald-400">
                          {m.social_fund.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          {m.late_fee.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          {m.absent_fee.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {m.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/members/${m.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                          No members yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter className="bg-muted/50">
                    <TableRow>
                      <TableCell className="font-bold">Grand Total</TableCell>
                      <TableCell className="text-right font-bold">{grandTotals.shares.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">
                        {grandTotals.social_fund.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-400">
                        {grandTotals.late_fee.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-400">
                        {grandTotals.absent_fee.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-cyan-300">
                        {grandTotals.total.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-4">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
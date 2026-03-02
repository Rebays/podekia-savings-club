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
import { ContributionsOverviewTable } from '@/components/ContributionsOverviewTable'

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
    .select('member_id, shares, social_fund, outstanding_fee')

  // Calculate per-member totals
  const memberBalances: Record<string, {
    shares: number
    social_fund: number
    outstanding: number
    total: number
  }> = {}

  contributions?.forEach(row => {
    if (!memberBalances[row.member_id]) {
      memberBalances[row.member_id] = { shares: 0, social_fund: 0, outstanding: 0, total: 0 }
    }
    memberBalances[row.member_id].shares += row.shares ?? 0
    memberBalances[row.member_id].social_fund += row.social_fund ?? 0
    memberBalances[row.member_id].outstanding += row.outstanding_fee ?? 0
    memberBalances[row.member_id].total +=
      (row.shares ?? 0) + (row.social_fund ?? 0)
  })

  // Combine profiles with balances
  const members = profiles?.map(p => {
    const balance = memberBalances[p.id] || { shares: 0, social_fund: 0, outstanding: 0, total: 0 }
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
      outstanding: acc.outstanding + m.outstanding,
      total: acc.total + m.total,
    }),
    { shares: 0, social_fund: 0, outstanding: 0, total: 0 }
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
                <ContributionsOverviewTable members={members} grandTotals={grandTotals} />
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
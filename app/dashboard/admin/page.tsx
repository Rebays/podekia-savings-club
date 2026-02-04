// app/dashboard/admin/page.tsx
// SERVER COMPONENT – no "use client", no hooks, no Recharts imports here

import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppSidebar } from '@/components/app-sidebar'
import { Users, DollarSign, AlertTriangle, FileText } from 'lucide-react'
import { ChartsClient } from './ChartsClient'  // ← new client component

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient(true)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // if (profile?.role !== 'admin') {
  //   return (
  //     <div className="min-h-screen bg-background p-8 text-center">
  //       <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
  //       <p className="mt-4 text-muted-foreground">Only administrators can access this area.</p>
  //     </div>
  //   )
  // }

  // Fetch stats (same as before)
  const { count: memberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { data: contributions } = await supabase
    .from('contributions')
    .select('shares, social_fund, late_fee, absent_fee, fortnight')

  const totals = contributions?.reduce(
    (acc, r) => ({
      shares: acc.shares + (r.shares ?? 0),
      social: acc.social + (r.social_fund ?? 0),
      late: acc.late + (r.late_fee ?? 0),
      absent: acc.absent + (r.absent_fee ?? 0),
    }),
    { shares: 0, social: 0, late: 0, absent: 0 }
  ) ?? { shares: 0, social: 0, late: 0, absent: 0 }

  const grandTotal = totals.shares + totals.social + totals.late + totals.absent

  // Prepare chart data on server
  const fortnights = Array.from({ length: 23 }, (_, i) => i + 1)
  const chartData = fortnights.map(fn => {
    const contrib = contributions?.filter(c => c.fortnight === fn) || []
    const total = contrib.reduce((sum, c) => sum + (c.shares ?? 0) + (c.social_fund ?? 0) + (c.late_fee ?? 0) + (c.absent_fee ?? 0), 0)
    return { fortnight: `FN ${fn}`, total }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                Club overview & key metrics
              </p>
            </div>
            <Badge variant="secondary" className="px-4 py-1 text-sm">
              Admin Mode
            </Badge>
          </div>

          {/* Total Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-linear-to-br from-card to-muted/40 border-border/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  Total Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{memberCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active club members</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-card to-muted/40 border-border/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-cyan-400" />
                  Total Contribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$ {grandTotal ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total contributions collected</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-card to-muted/40 border-border/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Avg per Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">
                  $ {memberCount > 0 ? (grandTotal / memberCount).toFixed(0) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average total contribution</p>
              </CardContent>
            </Card>

            {/* Late Fee Percentage */}
            <Card className="bg-linear-to-br from-card to-muted/40 border-border/50 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  Late Fee %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-400">
                  {grandTotal > 0 ? ((totals.late / grandTotal) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Of total contributions</p>
              </CardContent>
            </Card>

            {/* ... other cards ... */}
          </div>

          {/* Charts – now in client component */}
          <ChartsClient chartData={chartData} totals={totals} />

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ... your quick links ... */}
          </div>
        </div>
      </div>
    </div>
  )
}
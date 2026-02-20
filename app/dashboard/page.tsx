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
import { ContributionsTable } from '@/components/ContributionsTable'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch contributions
  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('fortnight, date, shares, social_fund, late_fee, absent_fee, notes')
    .eq('member_id', user.id)
    .order('fortnight', { ascending: true })

  console.log('User ID:', user.id)
  console.log('Contributions:', contributions)
  console.log('Fetch error:', error)

  if (error) {
    console.error('Error fetching contributions:', error)
    return (
      <div className="p-8 text-red-400">
        Error loading your contributions: {error.message}
      </div>
    )
  }

  // Calculate totals
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                {user.email}
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm">
              Member
            </Badge>
          </div>

          <Separator className="my-6" />

          {/* Balance Overview Card */}
          <Card className="bg-gradient-to-br from-card to-muted/40 border-border/50 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-muted-foreground">
                Your Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
                    ${grandTotal.toLocaleString()}
                  </p>
                  <p className="text-lg text-muted-foreground mt-1">
                    SBD equivalent
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Shares</p>
                    <p className="text-2xl font-bold text-black">${totals.shares}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Social Fund</p>
                    <p className="text-2xl font-bold text-emerald-400">${totals.social}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Late Fees</p>
                    <p className="text-2xl font-bold text-red-400">${totals.late}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absent Fees</p>
                    <p className="text-2xl font-bold text-red-400">${totals.absent}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Contributions Table */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Recent Contributions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardContent className="p-0">
                <ContributionsTable contributions={contributions} />
              </CardContent>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-6">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
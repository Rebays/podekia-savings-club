// app/dashboard/settlements/page.tsx
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
import { AppSidebar } from '@/components/app-sidebar'

export default async function MemberSettlementsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Optional: confirm it's not admin (but allow admins if they visit this path)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Fetch member's own outstanding fees (RLS ensures only own data)
  const { data: contributions } = await supabase
    .from('contributions')
    .select('outstanding_fee, fortnight, notes')
    .eq('member_id', user.id)

  const totalOutstanding = contributions?.reduce(
    (sum, c) => sum + (c.outstanding_fee ?? 0),
    0
  ) ?? 0

  const hasOutstanding = totalOutstanding > 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            My Settlements
          </h1>
          <p className="text-muted-foreground">
            View your outstanding fees and payment history
          </p>

          {/* Summary Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Your Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl md:text-6xl font-bold text-red-400">
                  ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-lg text-muted-foreground mt-2">
                  {hasOutstanding
                    ? "You have pending fees to settle"
                    : "No outstanding fees – thank you!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Breakdown Table */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Fortnight</TableHead>
                      <TableHead className="text-right">Outstanding Fee</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions?.map((c, index) => (
                      <TableRow key={index}>
                        <TableCell>Fortnight {c.fortnight || '—'}</TableCell>
                        <TableCell className="text-right font-medium text-red-400">
                          ${(c.outstanding_fee ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}

                    {(!contributions || contributions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                          No outstanding fees recorded
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {!hasOutstanding && (
                <div className="mt-6 text-center text-sm text-muted-foreground italic">
                  Contact the treasurer if you believe this is incorrect.
                </div>
              )}
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
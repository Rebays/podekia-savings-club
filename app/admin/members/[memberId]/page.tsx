// app/dashboard/admin/members/[memberId]/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Edit, Plus } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin check
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return <div className="p-8 text-red-500 text-center">Access Denied</div>
  }

  // Await params (Next.js 15 requirement)
  const { memberId } = await params

  // Fetch member info
  const { data: member } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      address,
      created_at
    `)
    .eq('id', memberId)
    .single()

  if (!member) {
    return <div className="p-8 text-center">Member not found</div>
  }

  // Fetch email separately from auth.users (admin API)
  const { data: authUser } = await supabase.auth.admin.getUserById(memberId)

  // Fetch contributions
  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('id, fortnight, date, shares, social_fund, late_fee, absent_fee, notes')
    .eq('member_id', memberId)
    .order('fortnight', { ascending: true })

  if (error) {
    console.error('Error fetching contributions:', error)
    return <div className="p-8 text-red-400">Error loading contributions</div>
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

  // Server Action: Add new contribution
  async function addContribution(formData: FormData) {
    'use server'

    const supabase = await createSupabaseServerClient()

    const memberId = formData.get('memberId') as string
    const fortnight = Number(formData.get('fortnight'))
    const date = formData.get('date') as string
    const shares = Number(formData.get('shares') || 0)
    const social_fund = Number(formData.get('social_fund') || 0)
    const late_fee = Number(formData.get('late_fee') || 0)
    const absent_fee = Number(formData.get('absent_fee') || 0)
    const notes = formData.get('notes') as string

    const { error } = await supabase.from('contributions').insert({
      member_id: memberId,
      fortnight,
      date,
      shares,
      social_fund,
      late_fee,
      absent_fee,
      notes,
    })

    if (error) throw new Error(error.message)

    // Refresh the page after successful action
    revalidatePath(`/dashboard/admin/members/${memberId}`)
  }

  // Server Action: Delete contribution
  async function deleteContribution(id: string) {
    'use server'

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    // Refresh the page (you can get memberId from formData if needed)
    revalidatePath(`/dashboard/admin/members/${memberId}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {member.full_name || 'Member'} Contributions
              </h1>
              <p className="text-muted-foreground mt-1">
                {authUser?.user?.email || '—'} • {member.role}
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-1 text-sm">
              Admin View
            </Badge>
          </div>

          <Separator className="my-6" />

          {/* Summary */}
          <Card className="bg-linear-to-br from-card to-muted/40 border-border/50 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-muted-foreground">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-6xl font-bold text-center md:text-left">
                {grandTotal.toLocaleString()}
              </p>
              <p className="text-lg text-muted-foreground mt-2 text-center md:text-left">
                SBD equivalent • All fortnights
              </p>
            </CardContent>
          </Card>

          {/* Add New Contribution Form */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Add New Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addContribution} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input type="hidden" name="memberId" value={memberId} />

                <div className="space-y-2">
                  <Label htmlFor="fortnight">Fortnight (1-23)</Label>
                  <Input name="fortnight" type="number" min="1" max="23" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input name="date" type="date" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shares">Shares</Label>
                  <Input name="shares" type="number" min="0" step="0.01" defaultValue="0" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_fund">Social Fund</Label>
                  <Input name="social_fund" type="number" min="0" step="0.01" defaultValue="0" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="late_fee">Late Fee</Label>
                  <Input name="late_fee" type="number" min="0" step="0.01" defaultValue="0" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="absent_fee">Absent Fee</Label>
                  <Input name="absent_fee" type="number" min="0" step="0.01" defaultValue="0" required />
                </div>

                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input name="notes" />
                </div>

                <div className="md:col-span-3 flex justify-end">
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Contribution
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Contributions Table */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Contribution History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                      <TableHead className="text-right">Row Total</TableHead>
                      <TableHead className="text-right">Cumulative</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributions?.map((row) => {
                      const rowTotal =
                        (row.shares ?? 0) +
                        (row.social_fund ?? 0) +
                        (row.late_fee ?? 0) +
                        (row.absent_fee ?? 0)

                      return (
                        <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{row.fortnight}</TableCell>
                          <TableCell>{row.date || '—'}</TableCell>
                          <TableCell className="text-right">{row.shares || 0}</TableCell>
                          <TableCell className="text-right text-emerald-400">{row.social_fund || 0}</TableCell>
                          <TableCell className="text-right text-red-400">{row.late_fee || 0}</TableCell>
                          <TableCell className="text-right text-red-400">{row.absent_fee || 0}</TableCell>
                          <TableCell className="text-right font-medium">{rowTotal}</TableCell>
                          <TableCell className="text-right font-bold text-cyan-300">
                            {/* You'd need cumulative logic here if desired */}
                            {rowTotal}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{row.notes || '—'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <form action={deleteContribution.bind(null, row.id)} className="inline">
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {(!contributions || contributions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                          No contributions yet for this member
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Server Action: Add contribution
async function addContribution(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()

  const memberId = formData.get('memberId') as string
  const fortnight = Number(formData.get('fortnight'))
  const date = formData.get('date') as string
  const shares = Number(formData.get('shares') || 0)
  const social_fund = Number(formData.get('social_fund') || 0)
  const late_fee = Number(formData.get('late_fee') || 0)
  const absent_fee = Number(formData.get('absent_fee') || 0)
  const notes = formData.get('notes') as string

  const { error } = await supabase.from('contributions').insert({
    member_id: memberId,
    fortnight,
    date,
    shares,
    social_fund,
    late_fee,
    absent_fee,
    notes,
  })

  if (error) throw new Error(error.message)

  // Revalidate or redirect
  return { success: true }
}

// Server Action: Delete contribution
async function deleteContribution(id: string) {
  'use server'

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  return { success: true }
}
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
import { MemberContributionsClient } from './MemberContributionsClient'
import { ResetPasswordButton } from '@/components/ResetPasswordButton'

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

  const { memberId } = await params

  // Fetch member info
  const { data: member } = await supabase
    .from('profiles')
    .select('id, full_name, role, address, created_at')
    .eq('id', memberId)
    .single()

  if (!member) {
    return <div className="p-8 text-center">Member not found</div>
  }

  // Fetch email
  const { data: authUser } = await supabase.auth.admin.getUserById(memberId)

  // Fetch contributions
  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('id, fortnight, date, shares, social_fund, late_fee, absent_fee, notes, outstanding_fee')
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
      outstanding: acc.outstanding + (r.outstanding_fee ?? 0),
    }),
    { shares: 0, social: 0, outstanding: 0 }
  ) ?? { shares: 0, social: 0, outstanding: 0 }

  const grandTotal = totals.shares + totals.social
  const totalOutstanding = totals.outstanding

  // Server Action: Add contribution
  async function addContribution(formData: FormData) {
    'use server'

    const supabase = await createSupabaseServerClient(true)

    const memberId = formData.get('memberId') as string
    const fortnight = Number(formData.get('fortnight'))
    const date = formData.get('date') as string
    const shares = Number(formData.get('shares') || 0)
    const social_fund = Number(formData.get('social_fund') || 0)
    const late_fee = Number(formData.get('late_fee') || 0)
    const absent_fee = Number(formData.get('absent_fee') || 0)
    const notes = formData.get('notes') as string

    // Insert the base contribution
    const { data: newContribution, error } = await supabase.from('contributions').insert({
      member_id: memberId,
      fortnight,
      date,
      shares,
      social_fund,
      notes,
      late_fee, // Keep a record of the fee
      absent_fee, // Keep a record of the fee
    }).select().single()

    if (error) throw new Error(error.message)

    // Add late/absent fees to outstanding balance
    const feeTotal = late_fee + absent_fee
    if (feeTotal > 0) {
      const { data: latest } = await supabase
        .from('contributions')
        .select('id, outstanding_fee')
        .eq('member_id', memberId)
        .order('fortnight', { ascending: false })
        .limit(1)

      const latestContribution = latest?.[0]

      if (latestContribution) {
        const newOutstanding = (latestContribution.outstanding_fee ?? 0) + feeTotal
        await supabase
          .from('contributions')
          .update({ outstanding_fee: newOutstanding })
          .eq('id', latestContribution.id)
      } else {
        // This case is unlikely if we just inserted one, but as a fallback
        await supabase
          .from('contributions')
          .update({ outstanding_fee: feeTotal })
          .eq('id', newContribution.id)
      }
    }

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

    revalidatePath(`/dashboard/admin/members/${memberId}`)
  }

  // Server Action: Add outstanding fee
  async function addOutstandingFee(formData: FormData) {
    'use server'

    const supabase = await createSupabaseServerClient(true)

    const memberId = formData.get('memberId') as string
    const amount = Number(formData.get('amount'))
    const reason = formData.get('reason') as string || 'Manual fee added'

    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount')

    const { data: latest } = await supabase
      .from('contributions')
      .select('id, outstanding_fee, notes')
      .eq('member_id', memberId)
      .order('fortnight', { ascending: false })
      .limit(1)

    if (latest?.[0]) {
      const newOutstanding = (latest[0].outstanding_fee ?? 0) + amount
      await supabase
        .from('contributions')
        .update({
          outstanding_fee: newOutstanding,
          notes: `${latest[0].notes || ''}\n${reason} (+$${amount})`
        })
        .eq('id', latest[0].id)
    } else {
      await supabase.from('contributions').insert({
        member_id: memberId,
        fortnight: 1,
        outstanding_fee: amount,
        notes: reason,
      })
    }

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
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-1 text-sm">
                Admin View
              </Badge>

              <ResetPasswordButton
                memberId={memberId}
                email={authUser?.user?.email || ''}
                fullName={member.full_name}
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Outstanding Fees Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Outstanding Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-md">
                <span className="font-medium">Current Outstanding</span>
                <span className="text-2xl font-bold text-red-400">
                  ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Form to add fee */}
              <form action={addOutstandingFee} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="hidden" name="memberId" value={memberId} />

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount to Add (SBD)</Label>
                  <Input name="amount" type="number" min="0.01" step="0.01" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason / Notes</Label>
                  <Input name="reason" placeholder="e.g. Late payment penalty" />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" variant="destructive">
                    Add to Outstanding
                  </Button>
                </div>
              </form>
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
          <MemberContributionsClient
            memberId={memberId}
            contributions={contributions}
            grandTotal={grandTotal}
            addContribution={addContribution}
            deleteContribution={deleteContribution}
          />
        </div>
      </div>
    </div>
  )
}
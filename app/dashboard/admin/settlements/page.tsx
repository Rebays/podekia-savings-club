// app/dashboard/admin/settlements/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server' // ← fixed path
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache' // ← added this import

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AppSidebar } from '@/components/app-sidebar'

export default async function SettlementsPage() {
  const supabase = await createSupabaseServerClient(true)

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Admin check
  const { data: admin } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id) // ← safe after null check
    .single()

  if (admin?.role !== 'admin') {
    return <div className="p-8 text-red-500 text-center">Access Denied</div>
  }

      // Get members + their current outstanding

      const { data: members } = await supabase

        .from('profiles')

        .select(`

          id,

          full_name,

          contributions (outstanding_fee)

        `)

        .order('full_name')
    
      // Flatten and sum outstanding per member
  const memberData = members?.map(m => ({
    id: m.id,
    full_name: m.full_name || '—',
    outstanding: m.contributions?.reduce((sum, c) => sum + (c.outstanding_fee ?? 0), 0) || 0
  })) ?? []
  

  // Server Action: Record settlement
  async function settlePayment(formData: FormData) {
    'use server'

    const supabaseAdmin = await createSupabaseServerClient(true)

    const memberId = formData.get('memberId') as string
    const amount = Number(formData.get('amount'))
    const notes = formData.get('notes') as string || 'Payment settlement'

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // 1. Insert payment record
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        member_id: memberId,
        amount,
        payment_date: new Date().toISOString().split('T')[0],
        notes,
        created_by: user!.id, // ← safe here
      })

    if (paymentError) throw paymentError

    // 2. Reduce outstanding and increase social fund
    const { data: latestContrib } = await supabaseAdmin
      .from('contributions')
      .select('id, outstanding_fee, social_fund')
      .eq('member_id', memberId)
      .order('fortnight', { ascending: false })
      .limit(1)

    if (latestContrib?.[0]) {
      const newOutstanding = Math.max(0, (latestContrib[0].outstanding_fee ?? 0) - amount)
      const newSocialFund = (latestContrib[0].social_fund ?? 0) + amount

      await supabaseAdmin
        .from('contributions')
        .update({
          outstanding_fee: newOutstanding,
          social_fund: newSocialFund,
        })
        .eq('id', latestContrib[0].id)
    }

    revalidatePath('/dashboard/admin/settlements')
    revalidatePath(`/dashboard/admin/members/${memberId}`) // Also revalidate member page
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Payment Settlements
          </h1>
          <p className="text-muted-foreground">
            Settle outstanding fees from members
          </p>

          <Card className="border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle>Members with Outstanding Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Outstanding (SBD)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberData.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
                        <TableCell className="text-right font-bold text-red-400">
                          {m.outstanding > 0 ? m.outstanding.toLocaleString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.outstanding > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Settle Payment
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Settle for {m.full_name}</DialogTitle>
                                </DialogHeader>
                                <form action={settlePayment} className="space-y-4 py-4">
                                  <input type="hidden" name="memberId" value={m.id} />
                                  <div className="space-y-2">
                                    <Label>Amount Paid (SBD)</Label>
                                    <Input name="amount" type="number" min="0.01" step="0.01" required />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Notes (optional)</Label>
                                    <Input name="notes" placeholder="e.g. Bank transfer, cash" />
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit">Record Payment</Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {memberData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                          No outstanding fees currently
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
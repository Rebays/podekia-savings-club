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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MemberContributionsClient } from './MemberContributionsClient'

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

    const supabase = await createSupabaseServerClient(true)

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
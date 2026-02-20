// app/dashboard/admin/members/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'

import MembersClient from './MembersClient'  // ← new client component
import { AppSidebar } from '@/components/app-sidebar'

export default async function AdminMembersPage() {
  const supabase = await createSupabaseServerClient(true)  // true = service_role

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-8 text-center">
        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-4 text-muted-foreground">Only administrators can access this page.</p>
      </div>
    )
  }

  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role, address, created_at')
    .order('full_name')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return <div className="p-8 text-red-400">Error loading members</div>
  }

  // Fetch emails (admin API)
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.warn('Could not fetch emails:', authError.message)
  }

  // Combine data
  const members = profiles.map(profile => {
    const authUser = authUsers?.find(u => u.id === profile.id)
    return {
      ...profile,
      email: authUser?.email || '—',
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <MembersClient initialMembers={members} />
    </div>
  )
}
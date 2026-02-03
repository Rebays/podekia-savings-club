// app/dashboard/admin/members/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppSidebar } from '@/components/app-sidebar'

export default async function AdminMembersPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin role
  const { data: profile, error: roleError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (roleError || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background p-8 text-center">
        <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-4 text-muted-foreground">Only administrators can access this page.</p>
      </div>
    )
  }

  // Step 1: Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role, address, created_at')
    .order('full_name')

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
    return <div className="p-8 text-red-400">Error loading members</div>
  }

  // Step 2: Get emails from auth.users (admin-only API)
  // Note: this requires your service_role key (never expose in client)
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('Error fetching auth users:', authError)
    // Fallback: show without emails
    console.warn('Continuing without emails due to auth error')
  }

  // Map emails to profiles
  const membersWithEmail = profiles.map(profile => {
    const authUser = authUsers?.users.find(u => u.id === profile.id)
    return {
      ...profile,
      email: authUser?.email || '—',
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Admin – Manage Members & Contributions
          </h1>

          <p className="text-muted-foreground">
            Click on a member to view and edit their contributions
          </p>

          <Card className="border-border/50 shadow-lg mt-8">
            <CardHeader>
              <CardTitle>All Members ({membersWithEmail.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersWithEmail.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{m.full_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{m.email}</TableCell>
                        <TableCell>
                          <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>
                            {m.role || 'member'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {m.address || '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/members/${m.id}`}>
                              View & Edit Contributions
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {membersWithEmail.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          No members yet
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
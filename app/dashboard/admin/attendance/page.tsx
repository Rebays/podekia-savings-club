// app/dashboard/admin/attendance/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AppSidebar } from '@/components/app-sidebar'

export default async function AttendancePage() {
  const supabase = await createSupabaseServerClient(true)

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

  // Fetch all members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  // Server Action: Save attendance for a fortnight
  async function saveAttendance(formData: FormData) {
    'use server'

    const supabase = await createSupabaseServerClient(true)

    const fortnight = Number(formData.get('fortnight'))
    const date = formData.get('date') as string

    for (const member of members ?? []) {
      const present = formData.get(`present_${member.id}`) === 'true'

      await supabase.from('attendance').insert({
        member_id: member.id,
        fortnight,
        date,
        present,
        notes: formData.get(`notes_${member.id}`) as string || null,
      })
    }

    revalidatePath('/dashboard/admin/attendance')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Taking
          </h1>

          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Mark Attendance for Fortnight</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveAttendance} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fortnight">Fortnight (1-23)</Label>
                    <Input name="fortnight" type="number" min="1" max="23" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input name="date" type="date" required />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Members ({members?.length || 0})</h3>
                  <div className="space-y-4">
                    {members?.map(member => (
                      <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg border-border/50">
                        <div className="flex-1">
                          <p className="font-medium">{member.full_name || '—'}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <Switch name={`present_${member.id}`} defaultChecked />
                          <Label htmlFor={`present_${member.id}`}>Present</Label>
                        </div>

                        <Input name={`notes_${member.id}`} placeholder="Notes (optional)" className="max-w-xs" />
                      </div>
                    ))}

                    {(!members || members.length === 0) && (
                      <div className="p-8 text-center text-muted-foreground">
                        No members yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                    Save Attendance
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
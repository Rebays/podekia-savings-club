// app/dashboard/attendance/page.tsx
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
import { AppSidebar } from '@/components/app-sidebar'

export default async function MemberAttendancePage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch member's own attendance records
  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('fortnight, date, present, notes')
    .eq('member_id', user.id)
    .order('fortnight', { ascending: true })

  if (error) {
    console.error('Error fetching attendance:', error)
    return <div className="p-8 text-red-400">Error loading attendance</div>
  }

  const totalAbsent = attendance?.filter(a => !a.present).length || 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            My Attendance
          </h1>
          <p className="text-muted-foreground">
            View your attendance history
          </p>

          {/* Summary Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Your Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-5xl md:text-6xl font-bold">
                {attendance?.length || 0} sessions
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                Absent {totalAbsent} time{totalAbsent === 1 ? '' : 's'}
              </p>
              {totalAbsent > 0 && (
                <p className="text-sm text-red-400 mt-4">
                  Please settle any associated fees in Settlements
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Fortnight</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance?.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>Fortnight {record.fortnight}</TableCell>
                        <TableCell>{record.date || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={record.present ? "default" : "destructive"}
                            className={record.present ? "bg-green-500/20 text-green-700" : ""}
                          >
                            {record.present ? "Present" : "Absent"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.notes || '—'}
                        </TableCell>
                      </TableRow>
                    ))}

                    {(!attendance || attendance.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          No attendance records yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
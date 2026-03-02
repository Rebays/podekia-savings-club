// app/dashboard/admin/contribution-sheets/page.tsx
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppSidebar } from '@/components/app-sidebar'
import { Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export default async function ContributionSheetsPage() {
  const supabase = await createSupabaseServerClient(true)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin check
  const { data: admin } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (admin?.role !== 'admin') {
    return <div className="p-8 text-red-500 text-center">Access Denied</div>
  }

  // Fetch existing sheets (latest first)
  const { data: sheets } = await supabase
    .from('fortnightly_contribution_sheets')
    .select('*')
    .order('fortnight', { ascending: false })

  // Server Action: Upload sheet
  async function uploadSheet(formData: FormData) {
    'use server'

    const supabaseAdmin = await createSupabaseServerClient(true)

    const fortnight = Number(formData.get('fortnight'))
    const total_collected = Number(formData.get('total_collected')) || null
    const notes = formData.get('notes') as string || null
    const file = formData.get('signed_sheet') as File

    if (!file || file.size === 0) throw new Error('No file uploaded')

    if (fortnight < 1 || fortnight > 23) throw new Error('Invalid fortnight')

    // Upload to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `contrib-sheet-fn${fortnight}-${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('contribution-sheets')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const publicUrl = supabaseAdmin.storage
      .from('contribution-sheets')
      .getPublicUrl(fileName).data.publicUrl

    // Save record
    const { error } = await supabaseAdmin
      .from('fortnightly_contribution_sheets')
      .insert({
        fortnight,
        upload_date: new Date().toISOString().split('T')[0],
        signed_sheet_url: publicUrl,
        uploaded_by: user!.id,
        total_collected,
        notes,
      })

    if (error) throw error

    revalidatePath('/dashboard/admin/contribution-sheets')
  }

  // Server Action: Delete sheet
  async function deleteSheet(formData: FormData) {
    'use server'

    const supabaseAdmin = await createSupabaseServerClient(true)
    const sheetId = formData.get('sheetId') as string
    const sheetUrl = formData.get('sheetUrl') as string

    if (!sheetId || !sheetUrl) throw new Error('Missing sheet information')

    // 1. Delete from Storage
    const fileName = sheetUrl.split('/').pop()
    if (fileName) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('contribution-sheets')
        .remove([fileName])

      if (storageError) console.error(`Storage delete failed (might be ok if file was already gone):`, storageError.message)
    }

    // 2. Delete from DB
    const { error: dbError } = await supabaseAdmin
      .from('fortnightly_contribution_sheets')
      .delete()
      .eq('id', sheetId)

    if (dbError) throw new Error(dbError.message)

    revalidatePath('/dashboard/admin/contribution-sheets')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />

      <div className="lg:pl-72">
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Fortnightly Contribution Sheets
          </h1>
          <p className="text-muted-foreground">
            Upload photo/scan of signed collection list each fortnight
          </p>

          {/* Upload Form */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Upload Signed Sheet</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={uploadSheet} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fortnight">Fortnight (1-23)</Label>
                    <Input name="fortnight" type="number" min="1" max="23" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_collected">Total Collected (SBD, optional)</Label>
                    <Input name="total_collected" type="number" min="0" step="0.01" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signed_sheet">Signed Sheet Photo/Scan</Label>
                    <Input name="signed_sheet" type="file" accept="image/*,.pdf" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input name="notes" placeholder="e.g. Collected by John, 15 members present" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                    Upload Sheet
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List of previous uploads */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle>Previous Sheets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sheets?.map(sheet => (
                  <div key={sheet.id} className="p-4 border rounded-lg border-border/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Fortnight {sheet.fortnight}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {new Date(sheet.upload_date).toLocaleDateString()}
                        </p>
                        {sheet.total_collected && (
                          <p className="text-sm font-medium mt-1">
                            Reported total: ${sheet.total_collected.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={sheet.signed_sheet_url} target="_blank" rel="noopener noreferrer">
                            View Sheet
                          </a>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the sheet for Fortnight {sheet.fortnight}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <form action={deleteSheet}>
                                <input type="hidden" name="sheetId" value={sheet.id} />
                                <input type="hidden" name="sheetUrl" value={sheet.signed_sheet_url} />
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction type="submit">Delete</AlertDialogAction>
                              </form>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}

                {(!sheets || sheets.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground">
                    No sheets uploaded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
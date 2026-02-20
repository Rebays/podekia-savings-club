import { createSupabaseServerClient } from '@/lib/supabse/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient(true)

  const body = await request.json()
  const { id, full_name, address, role } = body

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, address, role })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
import { createSupabaseServerClient } from '@/lib/supabse/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(true)

  const { memberId, email } = await request.json()

  if (!memberId || !email) {
    return NextResponse.json({ error: 'Missing memberId or email' }, { status: 400 })
  }

  // Security check: caller must be admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: admin } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (admin?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ link: data.properties.action_link })
}
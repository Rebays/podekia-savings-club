import { createSupabaseServerClient } from '@/lib/supabse/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(true) 

  const body = await request.json()
  const { full_name, email, password, address } = body

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const { error: profileError } = await supabase
  .from('profiles')
  .upsert(
    {
      id: newUser.user.id,
      full_name: full_name.trim(),
      role: 'member',
      address: address || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id',           // conflict on primary key
      ignoreDuplicates: false,    // update the row if it exists
    }
  )

  if (profileError) {
    // Optional: delete the user if profile fails
    await supabase.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
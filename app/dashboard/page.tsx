// src/app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export default async function Dashboard() {
  const cookieStore = cookies()
  const supabase = createServerClient() // adjust based on your helper

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', user.id) // or match by email if needed
    .order('fortnight')

  return (
    <div className="p-8">
      <h1 className="text-3xl">Welcome, {user.email}</h1>
      <pre>{JSON.stringify(contributions, null, 2)}</pre>
    </div>
  )
}
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getCurrentUser() {
  const { data: { user } } = await supabaseBrowser.auth.getUser()
  return user
}

// Optional: quick sign-out helper
export async function signOut() {
  await supabaseBrowser.auth.signOut()
  window.location.href = "/login"
}
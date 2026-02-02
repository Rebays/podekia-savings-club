// middleware.ts   (or src/middleware.ts)

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Update the incoming request cookies
            request.cookies.set(name, value)
            // Update the outgoing response cookies
            response.cookies.set(name, value, options)
          })
          // Important: recreate response after cookie changes
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
        },
      },
    }
  )

  // This refreshes the session (very important!)
  await supabase.auth.getSession()

  // Protect dashboard routes (customize as needed)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, images, api routes, login, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|login|signup).*)',
  ],
}
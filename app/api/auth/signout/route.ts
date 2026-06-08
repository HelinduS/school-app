import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Setting cookies inside Route Handlers is allowed
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Deleting cookies inside Route Handlers is allowed
          }
        },
      },
    }
  )

  await supabase.auth.signOut()

  const { searchParams } = new URL(request.url)
  const error = searchParams.get('error') || 'no_profile'

  return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
}

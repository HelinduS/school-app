import { cache } from 'react'
import { createServerSupabaseClient } from './supabase-server'
import { AppUser, UserRole } from '@/types'
import { redirect } from 'next/navigation'

export const getUser = cache(async (): Promise<AppUser | null> => {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/api/auth/signout?error=no_profile')
  }
  return profile as AppUser
})

export async function requireAuth(): Promise<AppUser> {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(roles: UserRole[]): Promise<AppUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) redirect('/dashboard')
  return user
}

export function canEdit(role: UserRole): boolean {
  return role === 'principal' || role === 'admin_clerk'
}

export function canDelete(role: UserRole): boolean {
  return role === 'principal'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'principal'
}

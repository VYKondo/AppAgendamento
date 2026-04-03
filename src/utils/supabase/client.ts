import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // O createBrowserClient garante que o Supabase use os cookies corretamente no navegador
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
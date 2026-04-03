import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isDashboardRoot = request.nextUrl.pathname === '/dashboard'
  const isInsideDashboard = request.nextUrl.pathname.startsWith('/dashboard/')


  if (!user && isInsideDashboard && !isDashboardRoot) {
  // Pegamos a página que o usuário tentou acessar (ex: /dashboard/agendamento)
  const requestedPage = request.nextUrl.pathname
  
  // Criamos a URL de login com o parâmetro ?next=/dashboard/agendamento
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', requestedPage)
  
  return NextResponse.redirect(loginUrl)
}

}
export const config = {
  // Mantemos o matcher vigiando tudo sob /dashboard
  matcher: ['/dashboard/:path*'],
}
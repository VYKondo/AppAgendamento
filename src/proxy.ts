import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { RECEPTION_EMAILS } from './config/constants'

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
  const userEmail = user?.email?.toLowerCase()
  const isReceptionist = userEmail && (RECEPTION_EMAILS as readonly string[]).includes(userEmail)
  const pathname = request.nextUrl.pathname

  // 1. Definição de rotas que exigem autenticação obrigatória
  const protectedRoutes = ['/dashboard/consultas', '/dashboard/recepcao', '/dashboard/horarios']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/medico', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Restrições de Perfil: Recepção (Emails Especiais)
  // Agora podem acessar: recepcao, agendamento e consultas.
  if (isReceptionist) {
    const allowedForReception = [
      '/dashboard/recepcao',
      '/dashboard/agendamento',
      '/dashboard/consultas'
    ]
    const isAllowed = allowedForReception.some(route => pathname.startsWith(route))
    
    if (!isAllowed) {
      // Redireciona para a home da recepção se tentar acessar áreas não autorizadas (ex: horários ou home do dashboard)
      return NextResponse.redirect(new URL('/dashboard/recepcao', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
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

  // 👇 NOVA REGRA: Quais páginas devem ser trancadas? 
  // No nosso novo modelo, APENAS a rota de consultas do médico exige login.
  const isMedicoRoute = request.nextUrl.pathname.startsWith('/dashboard/consultas')

  // Se NÃO tem usuário logado E tentou acessar uma página exclusiva de médico
  if (!user && isMedicoRoute) {
    const requestedPage = request.nextUrl.pathname
    
    // 👇 Mudamos a rota de redirecionamento de '/login' para a nossa porta secreta '/medico'
    const loginUrl = new URL('/medico', request.url)
    loginUrl.searchParams.set('next', requestedPage)
    
    return NextResponse.redirect(loginUrl)
  }

  // IMPORTANTE: precisamos garantir que sempre retornamos a response no final
  return response
}

export const config = {
  // Mantemos o matcher vigiando o dashboard inteiro
  matcher: ['/dashboard/:path*'],
}
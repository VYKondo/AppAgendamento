'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Ribbon, Menu, X, LogOut } from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEY_PATIENT_TOKEN } from '@/lib/storage'
import Footer from '@/components/Footer' 
import { RECEPTION_EMAILS } from '@/config/constants'
import { useAgendamentoStore } from '@/store/useAgendamentoStore'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const { authState, setAuthState } = useAgendamentoStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Sincroniza estado de autenticação e redirecionamento de recepção
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email?.toLowerCase() || null
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PATIENT_TOKEN) : null

      if (isMounted) {
        setAuthState({
          isAuthenticated: !!session,
          userEmail: email,
          hasPatientToken: !!token,
          isLoading: false
        })

        // Redirecionamento automático para recepção se for recepcionista
        if (email && (RECEPTION_EMAILS as readonly string[]).includes(email)) {
          const isAllowedPath = pathname.startsWith('/dashboard/recepcao') || 
                               pathname.startsWith('/dashboard/agendamento') || 
                               pathname.startsWith('/dashboard/consultas')
          
          if (!isAllowedPath) {
            router.push('/dashboard/recepcao')
          }
        }
      }
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const email = session?.user?.email?.toLowerCase() || null
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PATIENT_TOKEN) : null
      
      if (isMounted) {
        setAuthState({
          isAuthenticated: !!session,
          userEmail: email,
          hasPatientToken: !!token
        })

        if (email && (RECEPTION_EMAILS as readonly string[]).includes(email)) {
          const isAllowedPath = pathname.startsWith('/dashboard/recepcao') || 
                               pathname.startsWith('/dashboard/agendamento') || 
                               pathname.startsWith('/dashboard/consultas')
          
          if (!isAllowedPath) {
            router.push('/dashboard/recepcao')
          }
        }
      }
    })

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe()
    }
  }, [pathname, router, setAuthState])

  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsMobileMenuOpen(false)
  }

  const { isAuthenticated, userEmail, hasPatientToken, isLoading: isLoadingAuth } = authState;

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_PATIENT_TOKEN)
      }
      setAuthState({ isAuthenticated: false, userEmail: null, hasPatientToken: false })
      router.push('/')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }, [router, setAuthState])

  const handleSairPaciente = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PATIENT_TOKEN)
    }
    setAuthState({ hasPatientToken: false })
    router.push('/')
  }, [router, setAuthState])

  const isReceptionist = userEmail && (RECEPTION_EMAILS as readonly string[]).includes(userEmail)
  const isRecepcaoPage = pathname === '/dashboard/recepcao'

  // Configuração dinâmica de links baseada no papel do usuário
  const NAV_LINKS = [
    { label: 'Recepção', href: '/dashboard/recepcao', show: isReceptionist },
    { label: 'Início', href: '/dashboard', show: !isReceptionist },
    { label: 'Agendar', href: '/dashboard/agendamento', show: true },
    { label: 'Meu agendamento', href: '/dashboard/meu_agendamento', show: !isAuthenticated && !isLoadingAuth && !isReceptionist },
    { label: 'Consultas', href: '/dashboard/consultas', show: isAuthenticated },
    { label: 'Horários', href: '/dashboard/horarios', show: isAuthenticated && !isReceptionist }
  ].filter(link => link.show)

  return (
    <div className="min-h-screen flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">

          {/* LOGO */}
          {(!isRecepcaoPage || isReceptionist) && (
            <Link href={isReceptionist ? "/dashboard/recepcao" : "/dashboard"} className="flex items-center gap-3 group">
              <div className="bg-pink-600/10 p-2 rounded-xl group-hover:bg-pink-600/20 transition-colors">
                <Ribbon className="text-pink-600 w-6 h-6" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-gray-800">
<<<<<<< HEAD
                Portal da Saúde
=======
                Câncer de Mama
>>>>>>> a046bd66e0b63460a576469a6134bfee79a6dbe3
              </span>
            </Link>
          )}

          {/* NAVEGAÇÃO DESKTOP */}
          {(!isRecepcaoPage || isReceptionist) && (
            <nav className="hidden lg:flex items-center space-x-1">
              {NAV_LINKS.map(link => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname === link.href 
                    ? 'text-pink-600 bg-pink-50 font-semibold' 
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* BOTÕES DE AÇÃO */}
          <div className={`flex items-center gap-4 ${(isRecepcaoPage && !isReceptionist) ? 'w-full justify-end' : ''}`}>
            {!isLoadingAuth && isAuthenticated && userEmail && (
              <div className="hidden lg:flex flex-col items-end leading-tight border-r border-gray-100 pr-4 text-right">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Autenticado</span>
                <span className="text-xs text-gray-500 font-medium max-w-[150px] truncate">{userEmail}</span>
              </div>
            )}

            {!isLoadingAuth && (isAuthenticated || hasPatientToken) && (
              <button 
                onClick={isAuthenticated ? handleLogout : handleSairPaciente}
                className={`${(isRecepcaoPage || isReceptionist) ? 'flex' : 'hidden lg:flex'} items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-all px-4 py-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100`}
              >
                <LogOut size={18} /> Sair
              </button>
            )}

            {(!isRecepcaoPage || isReceptionist) && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-gray-600 hover:text-pink-600 p-2 bg-gray-50 rounded-xl"
              >
                <Menu size={24} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="px-4 h-20 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-pink-50 p-2 rounded-xl"><Ribbon className="text-pink-600 w-6 h-6" /></div>
              <span className="font-heading font-bold text-xl">Menu</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-full"><X size={24} /></button>
          </div>

          <nav className="flex flex-col p-4 gap-2">
            {NAV_LINKS.map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`p-4 rounded-xl font-bold ${pathname === link.href ? 'bg-pink-50 text-pink-600' : 'text-gray-600'}`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            {(isAuthenticated || hasPatientToken) && (
              <button onClick={isAuthenticated ? handleLogout : handleSairPaciente} className="flex items-center gap-3 p-4 rounded-xl font-bold text-red-600 active:bg-red-50">
                <LogOut size={20} /> Sair
              </button>
            )}
          </nav>
        </div>
      )}

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer/>
    </div>
  )
}

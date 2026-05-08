'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Ribbon, Menu, X, LogOut } from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEY_PATIENT_TOKEN } from '@/lib/storage'
import Footer from '@/components/Footer' 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Estados de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Estado para saber se há um paciente "logado" via localStorage
  const [hasPatientToken, setHasPatientToken] = useState(false)

  const RECEPTION_EMAILS = [
    'agendamento.preventivorb@gmail.com',
    'agendamento.preventivofi@gmail.com',
    'agendamento.preventivogr@gmail.com'
  ]

  useEffect(() => {
    // 1. Verifica no momento em que a página carrega
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email?.toLowerCase() || null

      setIsAuthenticated(!!session)
      setUserEmail(email)

      // Redirecionamento para recepcionistas
      if (email && RECEPTION_EMAILS.includes(email)) {
        if (pathname !== '/dashboard/recepcao') {
          router.push('/dashboard/recepcao')
        }
      }

      setIsLoadingAuth(false) 
    }
    checkAuth()

    // 2. "Escuta" em tempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const email = session?.user?.email?.toLowerCase() || null
      setIsAuthenticated(!!session)
      setUserEmail(email)

      if (email && RECEPTION_EMAILS.includes(email)) {
        if (pathname !== '/dashboard/recepcao') {
          router.push('/dashboard/recepcao')
        }
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [pathname, router])

  // Verifica se o paciente tem um token salvo toda vez que a rota mudar
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_PATIENT_TOKEN)
    setHasPatientToken(!!token)
  }, [pathname])

  // Função para o médico sair da conta
  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Por garantia, limpa também o token do paciente caso algo tenha ficado preso
    localStorage.removeItem(STORAGE_KEY_PATIENT_TOKEN)
    setHasPatientToken(false)
    router.push('/')
  }

  // Função exclusiva para o PACIENTE limpar seu CPF
  const handleSairPaciente = () => {
    localStorage.removeItem(STORAGE_KEY_PATIENT_TOKEN)
    setHasPatientToken(false)
    router.push('/') // Joga para a home após limpar
  }

  // Verifica se o usuário logado é recepcionista
  const isReceptionist = userEmail && RECEPTION_EMAILS.includes(userEmail)

  // Verifica se estamos na página de recepção para simplificar o cabeçalho
  const isRecepcaoPage = pathname === '/dashboard/recepcao'

  return (
    <div className="min-h-screen flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">

          {/* LOGO - Oculto na recepção ou para recepcionistas */}
          {(!isRecepcaoPage && !isReceptionist) && (
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Ribbon className="text-primary w-6 h-6" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-textBase">
                Câncer de Mama
              </span>
            </Link>
          )}

          {/* NAVEGAÇÃO DESKTOP - Oculta na recepção ou para recepcionistas */}
          {(!isRecepcaoPage && !isReceptionist) && (
            <nav className="hidden lg:flex items-center space-x-1">
              <Link 
                href="/dashboard" 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  pathname === '/dashboard' 
                  ? 'text-primary bg-primary/5 font-semibold' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                Início
              </Link>

              <Link 
                href="/dashboard/agendamento" 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  pathname.startsWith('/dashboard/agendamento') 
                  ? 'text-primary bg-primary/5 font-semibold' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                Agendar
              </Link>

              {/* BOTÃO RESTRITO PARA PACIENTES */}
              {!isLoadingAuth && !isAuthenticated && (
                <Link 
                  href="/dashboard/meu_agendamento" 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname.startsWith('/dashboard/meu_agendamento') 
                    ? 'text-primary bg-primary/5 font-semibold' 
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Meu agendamento
                </Link>
              )}

              {/* BOTÕES RESTRITOS PARA MÉDICOS */}
              {isLoadingAuth ? (
                <div className="w-24 h-10 bg-gray-100/50 animate-pulse rounded-lg mt-0.5"></div>
              ) : (
                isAuthenticated && (
                  <>
                    <Link
                      href="/dashboard/consultas"
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        pathname.startsWith('/dashboard/consultas')
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      Consultas
                    </Link>

                    <Link
                      href="/dashboard/horarios"
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        pathname.startsWith('/dashboard/horarios')
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      Horários
                    </Link>
                  </>
                )
              )}
            </nav>
          )}

          {/* BOTÕES DE AÇÃO (DIREITA) */}
          <div className={`flex items-center gap-4 ${(isRecepcaoPage || isReceptionist) ? 'w-full justify-end' : ''}`}>

            {/* EMAIL DO USUÁRIO - DESKTOP (Sutil) */}
            {!isLoadingAuth && isAuthenticated && userEmail && (
              <div className="hidden lg:flex flex-col items-end leading-tight border-r border-gray-100 pr-4">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Acesso</span>
                <span className="text-xs text-gray-500 font-medium max-w-[150px] truncate" title={userEmail}>
                  {userEmail}
                </span>
              </div>
            )}

            {/* BOTÃO DE SAIR - MÉDICO / RECEPÇÃO */}
            {!isLoadingAuth && isAuthenticated && (
              <button 
                onClick={handleLogout}
                className={`${(isRecepcaoPage || isReceptionist) ? 'flex' : 'hidden lg:flex'} items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50`}
              >
                <LogOut size={18} /> Sair
              </button>
            )}

            {/* BOTÃO DE SAIR - PACIENTE */}
            {(!isRecepcaoPage && !isReceptionist) && !isLoadingAuth && !isAuthenticated && hasPatientToken && (
              <button 
                onClick={handleSairPaciente}
                className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                title="Limpar meus dados do dispositivo"
              >
                <LogOut size={18} /> Sair
              </button>
            )}

            {/* MENU MOBILE: Botão de abrir (Oculto na recepção) */}
            {(!isRecepcaoPage && !isReceptionist) && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-gray-600 hover:text-primary p-2"
              >
                <Menu size={24} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* OVERLAY DO MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col">
          {/* Cabeçalho do Mobile */}
          <div className="px-4 h-20 flex justify-between items-center border-b border-gray-100 shadow-sm">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Ribbon className="text-primary w-6 h-6" />
              </div>
              <span className="font-heading font-bold text-xl text-textBase">
                Menu
              </span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-gray-600 hover:text-primary p-2 bg-gray-50 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Links do Mobile */}
          <nav className="flex flex-col px-4 py-6 gap-2">
            {/* EMAIL DO USUÁRIO - MOBILE (Sutil) */}
            {!isLoadingAuth && isAuthenticated && userEmail && (
              <div className="px-4 py-3 mb-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-0.5">Conectado como:</span>
                <span className="text-sm text-gray-600 font-medium break-all">{userEmail}</span>
              </div>
            )}

            {!isReceptionist && (
              <>
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-4 rounded-xl font-medium transition-all ${
                    pathname === '/dashboard' 
                    ? 'text-primary bg-primary/5 font-semibold' 
                    : 'text-gray-600 active:bg-gray-50'
                  }`}
                >
                  Início
                </Link>

                <Link
                  href="/dashboard/agendamento"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-4 rounded-xl font-medium transition-all ${
                    pathname.startsWith('/dashboard/agendamento')
                    ? 'text-primary bg-primary/5 font-semibold'
                    : 'text-gray-600 active:bg-gray-50'
                  }`}
                >
                  Agendar
                </Link>
              </>
            )}

            {/* LINK NO MOBILE RESTRITO PARA PACIENTES */}
            {!isLoadingAuth && !isAuthenticated && !isReceptionist && (
              <Link 
                href="/dashboard/meu_agendamento" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-xl font-medium transition-all ${
                  pathname.startsWith('/dashboard/meu_agendamento') 
                  ? 'text-primary bg-primary/5 font-semibold' 
                  : 'text-gray-600 active:bg-gray-50'
                }`}
              >
                Meu agendamento
              </Link>
            )}

            {/* BOTÃO SAIR MOBILE - PACIENTE */}
            {!isLoadingAuth && !isAuthenticated && hasPatientToken && (
              <>
                <hr className="my-4 border-gray-100" />
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); handleSairPaciente(); }}
                  className="flex items-center gap-2 p-4 rounded-xl font-medium text-red-600 active:bg-red-50 text-left"
                >
                  <LogOut size={20} /> Sair da conta
                </button>
              </>
            )}

            {/* MENU MOBILE DO MÉDICO / RECEPÇÃO */}
            {!isLoadingAuth && isAuthenticated && (
              <>
                {!isReceptionist && (
                  <>
                    <Link 
                      href="/dashboard/consultas" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-4 rounded-xl font-medium transition-all ${
                        pathname.startsWith('/dashboard/consultas') 
                        ? 'text-primary bg-primary/5 font-semibold' 
                        : 'text-gray-600 active:bg-gray-50'
                      }`}
                    >
                      Consultas
                    </Link>

                    <Link
                      href="/dashboard/horarios"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`p-4 rounded-xl font-medium transition-all ${
                        pathname.startsWith('/dashboard/horarios')
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-gray-600 active:bg-gray-50'
                      }`}
                    >
                      Horários
                    </Link>
                  </>
                )}

                <hr className="my-4 border-gray-100" />

                <button 
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 p-4 rounded-xl font-medium text-red-600 active:bg-red-50 text-left"
                >
                  <LogOut size={20} /> Sair do Sistema
                </button>
              </>
            )}
          </nav>
        </div>
      )}
      {/* CONTEÚDO DAS PÁGINAS COM ANIMAÇÃO */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-10">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer/>
    </div>
  )
}
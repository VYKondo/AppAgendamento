'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// 👇 Importamos o 'X' para o botão de fechar do mobile
import { Ribbon, User, Menu, X } from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Footer from '@/components/Footer' 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Estados
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoadingRole, setIsLoadingRole] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // 👇 Estado do menu mobile

  useEffect(() => {
    const buscarRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        
        if (data) setUserRole(data.role)
      }
      setIsLoadingRole(false) 
    }
    buscarRole()
  }, [])

  return (
    <div className="min-h-screen flex flex-col antialiased">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          
          {/* LOGO */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Ribbon className="text-primary w-6 h-6" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-textBase">
              Câncer de Mama
            </span>
          </Link>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="hidden lg:flex space-x-1">
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

            {/* BOTÃO RESTRITO COM PREVENÇÃO DE PULO (SKELETON) */}
            {isLoadingRole ? (
              <div className="w-32 h-10 bg-gray-100/50 animate-pulse rounded-lg mt-0.5"></div>
            ) : (
              (userRole === 'admin' || userRole === 'medico') && (
                <Link 
                  href="/dashboard/consultas" 
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    pathname.startsWith('/dashboard/consultas') 
                    ? 'text-primary bg-primary/5 font-semibold' 
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Painel Médico
                </Link>
              )
            )}
          </nav>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden sm:flex items-center gap-2 border-2 border-gray-100 text-textBase hover:border-primary hover:text-primary font-semibold py-2 px-5 rounded-xl transition-all duration-300"
            >
              <User size={18} /> 
              <span>Login</span>
            </Link>
            
            {/* 👇 MENU MOBILE: Botão de abrir */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-gray-600 hover:text-primary p-2"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* 👇 OVERLAY DO MENU MOBILE */}
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

            {!isLoadingRole && (userRole === 'admin' || userRole === 'medico') && (
              <Link 
                href="/dashboard/consultas" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-xl font-medium transition-all ${
                  pathname.startsWith('/dashboard/consultas') 
                  ? 'text-primary bg-primary/5 font-semibold' 
                  : 'text-gray-600 active:bg-gray-50'
                }`}
              >
                Painel Médico
              </Link>
            )}

            <hr className="my-4 border-gray-100" />

            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 px-5 rounded-xl transition-all"
            >
              <User size={18} /> 
              <span>Fazer Login</span>
            </Link>
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
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Ribbon, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function MedicoLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard/consultas'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Login direto e seguro do Supabase usando E-mail e Senha
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (loginError) {
        throw new Error('E-mail ou senha incorretos. Acesso negado.')
      }

      // Se deu tudo certo, redirecionamos para o destino (ou padrão Consultas)
      router.push(redirectTo)
      
    } catch (err: any) {
      console.error("Erro no login:", err)
      setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        <Link href="/" className="flex justify-center items-center gap-3 mb-6 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Ribbon className="text-primary w-8 h-8" />
          </div>
          <span className="font-heading font-bold text-2xl text-textBase">Câncer de Mama</span>
        </Link>
        
        <h2 className="text-center text-3xl font-heading font-extrabold text-textBase flex items-center justify-center gap-3">
          <ShieldCheck className="text-primary" size={32} />
          Portal do Médico
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesso restrito para profissionais de saúde e administração.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full px-4 sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* CAMPO DE E-MAIL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">E-mail Profissional</label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm transition-all"
                  placeholder="doutor@clinica.com"
                />
              </div>
            </div>

            {/* CAMPO DE SENHA */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">Senha</label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* RECUPERAÇÃO DE SENHA */}
              <div className="mt-3 flex justify-end">
                <Link 
                  href="/esqueci-senha" 
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
            </div>

            {/* BOTÃO DE LOGIN */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={20} /> Autenticando...</>
                ) : (
                  'Acessar Sistema'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
} 
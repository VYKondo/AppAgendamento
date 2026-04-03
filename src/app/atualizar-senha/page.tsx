'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Ribbon, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AtualizarSenha() {
  const router = useRouter()
  const supabase = createClient()
  
  // Estados do formulário
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  
  // Estados de UI
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [mensagem, setMensagem] = useState('')

  // O Capturador de Sessão "À Prova de Balas"
  useEffect(() => {
    const capturarSessao = async () => {
      // 1. Tenta achar o código na URL (Fluxo PKCE: ?code=...)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
        return
      }

      // 2. Tenta achar o token após a cerquilha (Fluxo Implícito: #access_token=...)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // Força a sessão manualmente usando os tokens encontrados na URL
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
        }
      }
    }

    capturarSessao()
  }, [supabase])

  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMensagem('')

    if (senha.length < 6) {
      setStatus('error')
      setMensagem('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setStatus('error')
      setMensagem('As senhas não coincidem. Digite novamente.')
      return
    }

    // Chama o Supabase para atualizar a senha com a sessão que o useEffect capturou
    const { error } = await supabase.auth.updateUser({
      password: senha
    })

    if (error) {
      setStatus('error')
      setMensagem('Sua sessão expirou ou ocorreu um erro de permissão. Volte e valide seus dados novamente.')
      console.error('Erro ao atualizar senha:', error)
    } else {
      setStatus('success')
      setMensagem('Sua senha foi atualizada com sucesso!')
      
      await supabase.auth.signOut()
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center items-center gap-3 mb-6 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Ribbon className="text-primary w-8 h-8" />
          </div>
          <span className="font-heading font-bold text-2xl text-textBase">Câncer de Mama</span>
        </div>
        
        <h2 className="text-center text-3xl font-heading font-extrabold text-textBase">
          Criar Nova Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Digite sua nova senha abaixo para recuperar seu acesso.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full px-4 sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {status === 'error' && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
              <span>{mensagem}</span>
            </div>
          )}

          {status === 'success' ? (
            <div className="text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-textBase">Senha Atualizada!</h3>
              <p className="mt-2 text-sm text-gray-600 mb-6">{mensagem}</p>
              <p className="text-xs text-gray-400">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleAtualizarSenha} className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Nova Senha</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm"
                    placeholder="Mínimo de 6 caracteres"
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirmar Nova Senha</label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm"
                    placeholder="Repita a nova senha"
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-70 mt-4"
              >
                {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
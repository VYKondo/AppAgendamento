'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Ribbon, Mail, ChevronLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function EsqueciMinhaSenha() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [mensagem, setMensagem] = useState('')

  const handleRecuperacaoEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMensagem('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (error) {
      setStatus('error')
      setMensagem('Não foi possível enviar o e-mail. Verifique se o endereço está correto.')
    } else {
      setStatus('success')
      setMensagem('Enviamos um link de recuperação para o seu e-mail profissional. Verifique sua caixa de entrada (e o spam)!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        {/* 👇 O LINK AGORA APONTA PARA A ROTA DO MÉDICO */}
        <Link href="/medico" className="flex justify-center items-center gap-3 mb-6 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Ribbon className="text-primary w-8 h-8" />
          </div>
          <span className="font-heading font-bold text-2xl text-textBase">Câncer de Mama</span>
        </Link>
        
        <h2 className="text-center text-3xl font-heading font-extrabold text-textBase">
          Recuperar Acesso
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Informe seu e-mail profissional para redefinir a senha.
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
              <h3 className="text-xl font-bold text-textBase">E-mail Enviado!</h3>
              <p className="mt-2 text-sm text-gray-600">{mensagem}</p>
            </div>
          ) : (
            <form onSubmit={handleRecuperacaoEmail} className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold text-gray-700">E-mail cadastrado</label>
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

              <button
                type="submit" disabled={status === 'loading'}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : 'Enviar link de recuperação'}
              </button>
            </form>
          )}

          {!status.includes('success') && (
            <div className="mt-6 text-center">
              <Link href="/medico" className="inline-flex items-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
                <ChevronLeft size={16} /> Voltar para o Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
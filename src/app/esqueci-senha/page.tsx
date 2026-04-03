'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Ribbon, Mail, ChevronLeft, Loader2, AlertCircle, CheckCircle2, ShieldAlert, FileText, User } from 'lucide-react'

export default function EsqueciMinhaSenha() {
  const [metodo, setMetodo] = useState<'email' | 'dados'>('email')
  
  // Campos
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [cns, setCns] = useState('')
  
  // Estados de UI
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [mensagem, setMensagem] = useState('')
  
  const supabase = createClient()

  // MÁSCARA DE CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length > 11) valor = valor.substring(0, 11)
    if (valor.length > 9) valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
    else if (valor.length > 6) valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
    else if (valor.length > 3) valor = valor.replace(/(\d{3})(\d{1,3})/, '$1.$2')
    setCpf(valor)
  }

  // ENVIO VIA E-MAIL
  const handleRecuperacaoEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMensagem('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (error) {
      setStatus('error')
      setMensagem('Não foi possível enviar o e-mail. Verifique se o endereço está correto.')
    } else {
      setStatus('success')
      setMensagem('Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada (e o spam)!')
    }
  }

  // ENVIO VIA DADOS (BACKEND)
  const handleRecuperacaoDados = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMensagem('')

    try {
      const res = await fetch('/api/recuperar-senha-dados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, dataNascimento, cns })
      })

      // Lendo a resposta como texto primeiro para evitar o erro de JSON.parse se o servidor falhar
      const textResponse = await res.text()
      let data;
      
      try {
        data = JSON.parse(textResponse)
      } catch (err) {
        console.error("Resposta não-JSON da API:", textResponse)
        throw new Error('Erro de comunicação com o servidor. A rota da API pode estar com erro ou não existir.')
      }

      if (!res.ok) {
        throw new Error(data.error || 'Dados inconsistentes')
      }

      setStatus('success')
      setMensagem('Identidade confirmada! Redirecionando para alterar a senha...')
      
      // Sucesso! Joga o usuário para o link mágico que a API gerou.
      setTimeout(() => {
          window.location.href = data.recoveryLink;
      }, 2000)

    } catch (error: any) {
      setStatus('error')
      setMensagem(error.message || 'Os dados informados não conferem com nossos registros. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link href="/login" className="flex justify-center items-center gap-3 mb-6 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Ribbon className="text-primary w-8 h-8" />
          </div>
          <span className="font-heading font-bold text-2xl text-textBase">Câncer de Mama</span>
        </Link>
        
        <h2 className="text-center text-3xl font-heading font-extrabold text-textBase">
          Recuperar Conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Como você prefere redefinir sua senha?
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full px-4 sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {/* SELETOR DE MÉTODO DE RECUPERAÇÃO */}
          {!status.includes('success') && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setMetodo('email'); setStatus('idle'); setMensagem(''); }}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${metodo === 'email' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Por E-mail
              </button>
              <button
                onClick={() => { setMetodo('dados'); setStatus('idle'); setMensagem(''); }}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${metodo === 'dados' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sem E-mail
              </button>
            </div>
          )}

          {/* MENSAGENS DE ERRO OU SUCESSO */}
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
              <h3 className="text-xl font-bold text-textBase">Tudo Certo!</h3>
              <p className="mt-2 text-sm text-gray-600">{mensagem}</p>
            </div>
          ) : (
            <>
              {/* FORMULÁRIO 1: VIA EMAIL */}
              {metodo === 'email' && (
                <form onSubmit={handleRecuperacaoEmail} className="space-y-5 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">E-mail cadastrado</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm"
                        placeholder="seunome@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={status === 'loading'}
                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-70"
                  >
                    {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : 'Enviar link de recuperação'}
                  </button>
                </form>
              )}

              {/* FORMULÁRIO 2: VIA DADOS PESSOAIS */}
              {metodo === 'dados' && (
                <form onSubmit={handleRecuperacaoDados} className="space-y-5 animate-in fade-in duration-300">
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-2">
                    <ShieldAlert className="text-blue-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs text-blue-700">Para garantir sua segurança, precisamos confirmar alguns dados do seu prontuário antes de alterar a senha.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">CPF</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                      </div>
                      <input
                        type="text" required maxLength={14} value={cpf} onChange={handleCpfChange}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Data de Nascimento</label>
                    <input
                      type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)}
                      className="mt-1.5 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">CNS (Cartão SUS)</label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FileText size={18} />
                      </div>
                      <input
                        type="text" required maxLength={15} minLength={15} value={cns} onChange={(e) => setCns(e.target.value.replace(/\D/g, ''))}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm font-mono"
                        placeholder="000 0000 0000 0000"
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={status === 'loading'}
                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-70"
                  >
                    {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : 'Validar Identidade'}
                  </button>
                </form>
              )}
            </>
          )}

          {!status.includes('success') && (
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
                <ChevronLeft size={16} /> Voltar para o Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
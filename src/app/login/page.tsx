'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Ribbon, Mail, Lock, ChevronLeft, Loader2, AlertCircle, UserPlus, LogIn, CheckCircle2, User, Eye, EyeOff, MapPin, FileText, Users } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  
  const [isSignUp, setIsSignUp] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Dados Pessoais
  const [cpf, setCpf] = useState('')
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [nomeSocial, setNomeSocial] = useState('')
  const [cns, setCns] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [nacionalidade, setNacionalidade] = useState('')
  const [identidadeGenero, setIdentidadeGenero] = useState('')
  const [orientacaoSexual, setOrientacaoSexual] = useState('')

  // Filiação
  const [nomeMae, setNomeMae] = useState('')
  const [motherNotDeclared, setMotherNotDeclared] = useState(false)
  const [nomePai, setNomePai] = useState('')
  const [fatherNotDeclared, setFatherNotDeclared] = useState(false)

  // Endereço e Contato
  const [telefone, setTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)

  const handleBackToLogin = () => {
    setSuccess(false)
    setIsSignUp(false)
    setError(null)
    setPassword('')
    // Resetar demais campos conforme necessário
    setCpf('')
    setNomeCompleto('')
    setCns('')
    setDataNascimento('')
  }

  // MÁSCARA DE CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length > 11) valor = valor.substring(0, 11)
    
    if (valor.length > 9) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
    } else if (valor.length > 6) {
      valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
    } else if (valor.length > 3) {
      valor = valor.replace(/(\d{3})(\d{1,3})/, '$1.$2')
    }
    setCpf(valor)
  }

  // BUSCA DE CEP VIA API
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    
    if (valor.length > 5) {
      valor = valor.replace(/^(\d{5})(\d)/, '$1-$2')
    }
    setCep(valor)

    const cleanCep = valor.replace(/\D/g, '')
    
    if (cleanCep.length === 8) {
      setLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        
        if (!data.erro) {
          setRua(data.logradouro)
          setBairro(data.bairro)
          setCidade(data.localidade)
          setUf(data.uf)
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  // AUTENTICAÇÃO E CADASTRO
  // AUTENTICAÇÃO E CADASTRO
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Remove pontos e traços para enviar apenas números ao banco
    const cleanCpf = cpf.replace(/\D/g, '')

    try {
      if (isSignUp) {
        // ==========================================
        // 1. FLUXO DE CADASTRO (SIGN UP) - Mantido igual
        // ==========================================
        
        const authEmail = email.trim() !== '' ? email : `${cleanCpf}@profiles.sistema.local`

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
        })

        if (authError) {
          if (authError.message.includes('already registered')) {
            throw new Error('Este CPF ou E-mail já possui cadastro no sistema.')
          }
          throw authError
        }

        if (authData.user) {
          const { error: dbError } = await supabase.from('profiles').insert([
            {
              user_id: authData.user.id,
              cpf: cleanCpf,
              nome_completo: nomeCompleto,
              nome_social: nomeSocial,
              cns: cns,
              data_nascimento: dataNascimento,
              email: email, 
              telefone: telefone.replace(/\D/g, ''),
              identidade_genero: identidadeGenero,
              orientacao_sexual: orientacaoSexual,
              nacionalidade: nacionalidade,
              nome_mae: motherNotDeclared ? 'Não declarado' : nomeMae,
              nome_pai: fatherNotDeclared ? 'Não declarado' : nomePai,
              cep: cep.replace(/\D/g, ''),
              logradouro: rua,
              numero: numero,
              complemento: complemento,
              bairro: bairro,
              cidade: cidade,
              uf: uf
            }
          ])
          
          if (dbError) {
            console.error("Erro ao salvar dados do paciente:", dbError)
            throw new Error('Conta criada, mas houve um erro ao salvar o prontuário. Contate o suporte.')
          }
        }

        setSuccess(true)

      } else {
        // ==========================================
        // 2. FLUXO DE LOGIN (SIGN IN) - ATUALIZADO COM API
        // ==========================================
        
        // Passo A: Chamamos a API para buscar o e-mail via Service Role (Bypass RLS)
        const resEmail = await fetch('/api/buscar-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf: cleanCpf }),
        })

        const dataEmail = await resEmail.json()

        if (!resEmail.ok) {
          // Se a API retornar 404, cairá aqui (CPF não encontrado)
          throw new Error(dataEmail.error || 'Erro ao validar CPF.')
        }

        const emailParaLogin = dataEmail.email

        // Passo B: Fazer o login real com o Supabase usando o e-mail retornado
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: emailParaLogin,
          password: password,
        })

        if (loginError) {
          // O Supabase retorna 'Invalid login credentials' para senha errada
          throw new Error('Senha incorreta ou inválida.')
        }

        // Deu tudo certo, manda o paciente para o painel!
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error("Erro no HandleAuth:", err)
      setError(err.message || 'Ocorreu um erro inesperado. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link href="/dashboard" className="flex justify-center items-center gap-3 mb-6 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Ribbon className="text-primary w-8 h-8" />
          </div>
          <span className="font-heading font-bold text-2xl text-textBase">Câncer de Mama</span>
        </Link>
        
        {!success && (
          <>
            <h2 className="text-center text-3xl font-heading font-extrabold text-textBase">
              {isSignUp ? 'Cadastro de Paciente' : 'Acesse sua conta'}
            </h2>
            
            <p className="mt-2 text-center text-sm text-gray-600">
              {isSignUp ? 'Já possui prontuário?' : 'Ainda não tem conta?'}
              {' '}
              <button 
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="font-medium text-primary hover:text-secondary underline underline-offset-4"
              >
                {isSignUp ? 'Faça login' : 'Cadastre-se gratuitamente'}
              </button>
            </p>
          </>
        )}
      </div>

      <div className={`mt-8 sm:mx-auto w-full px-4 transition-all duration-300 ${isSignUp ? 'sm:max-w-4xl' : 'sm:max-w-md'}`}>
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="shrink-0 mt-0.5" size={18} /> 
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-4 animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-textBase">Perfil Criado!</h3>
              <p className="mt-2 text-sm text-gray-600">
                Os dados referentes ao CPF <strong>{cpf}</strong> foram registrados com sucesso. 
                Faça o login para acessar o portal.
              </p>
              <button 
                type="button"
                onClick={handleBackToLogin}
                className="mt-6 w-full flex justify-center items-center py-3 px-4 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleAuth}>
              
              {/* Substitua o bloco DADOS DE ACESSO por este: */}
              <div className={isSignUp ? "bg-gray-50/50 border border-gray-100 rounded-xl p-5 md:p-6" : ""}>
                {isSignUp && (
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <Lock className="text-primary" size={20} />
                    <h3 className="text-lg font-bold text-textBase">Credenciais de Acesso</h3>
                  </div>
                )}
                
                <div className={`grid grid-cols-1 gap-5 ${isSignUp ? 'md:grid-cols-2' : ''}`}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">CPF <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-semibold text-gray-700">Senha <span className="text-red-500">*</span></label>
                    <div className="mt-1.5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {!isSignUp && (
                      <div className="mt-2 flex justify-end">
                        <Link 
                          href="/esqueci-senha" 
                          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Esqueci minha senha
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* CAMPO DE E-MAIL (Só aparece no cadastro) */}
                  {isSignUp && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        E-mail <span className="font-normal text-gray-500">(Opcional, mas recomendado para recuperar senha)</span>
                      </label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary bg-white outline-none text-sm shadow-sm"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* --- CAMPOS EXCLUSIVOS DE CADASTRO --- */}
              {isSignUp && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  
                  {/* --- 2. DADOS PESSOAIS --- */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 md:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                      <FileText className="text-primary" size={20} />
                      <h3 className="text-lg font-bold text-textBase">Dados do Paciente</h3>
                    </div>

                    {/* Foco Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700">Nome Completo <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required minLength={3} value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)}
                          className="mt-1.5 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm shadow-sm" 
                          placeholder="Nome igual ao documento" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">Data de Nascimento <span className="text-red-500">*</span></label>
                        <input 
                          type="date" required min="1900-01-01" max={new Date().toISOString().split("T")[0]} value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} 
                          className="mt-1.5 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm shadow-sm text-gray-700" 
                        />
                      </div>

                      <div className="lg:col-span-3">
                        <label className="block text-sm font-semibold text-gray-700">CNS (Cartão SUS) <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required maxLength={15} minLength={15} pattern="\d{15}" title="O CNS deve conter 15 números" value={cns} onChange={(e) => setCns(e.target.value.replace(/\D/g, ''))}
                          className="mt-1.5 block w-full lg:w-1/2 px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm shadow-sm font-mono" 
                          placeholder="000 0000 0000 0000" 
                        />
                      </div>
                    </div>

                    {/* Foco Secundário */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-4">Informações Complementares</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-600">Nome Social</label>
                          <input 
                            type="text" value={nomeSocial} onChange={(e) => setNomeSocial(e.target.value)}
                            className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary bg-gray-50/50 text-sm" 
                            placeholder="Como prefere ser chamada(o)" 
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600">Identidade de Gênero</label>
                          <select 
                            value={identidadeGenero} onChange={(e) => setIdentidadeGenero(e.target.value)}
                            className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary bg-gray-50/50 text-sm"
                          >
                            <option value="">Não informado</option>
                            <option value="mulher_cis">Mulher Cisgênero</option>
                            <option value="mulher_trans">Mulher Transgênero</option>
                            <option value="homem_cis">Homem Cisgênero</option>
                            <option value="homem_trans">Homem Transgênero</option>
                            <option value="nao_binario">Não-Binário</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-600">Orientação Sexual</label>
                          <select 
                            value={orientacaoSexual} onChange={(e) => setOrientacaoSexual(e.target.value)}
                            className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary bg-gray-50/50 text-sm"
                          >
                            <option value="">Não informado</option>
                            <option value="heterossexual">Heterossexual</option>
                            <option value="homossexual">Homossexual</option>
                            <option value="bissexual">Bissexual</option>
                            <option value="assexual">Assexual</option>
                            <option value="outro">Outro</option>
                          </select>
                        </div>
                        
                        <div className="lg:col-span-4">
                           <label className="block text-sm font-medium text-gray-600">Nacionalidade</label>
                           <input 
                             type="text" value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)}
                             className="mt-1 block w-full md:w-1/4 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary bg-gray-50/50 text-sm" 
                             placeholder="Ex: Brasileira" 
                           />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- 3. FILIAÇÃO --- */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 md:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary/60"></div>
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                      <Users className="text-secondary/60" size={20} />
                      <h3 className="text-lg font-bold text-textBase">Filiação</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700">
                          Nome da Mãe {!motherNotDeclared && <span className="text-red-500">*</span>}
                        </label>
                        <input 
                          type="text" required={!motherNotDeclared} disabled={motherNotDeclared} value={nomeMae} onChange={(e) => setNomeMae(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all" 
                          style={{ opacity: motherNotDeclared ? 0.7 : 1 }}
                          placeholder="Nome completo da mãe" 
                        />
                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="checkbox" id="motherNotDeclared" checked={motherNotDeclared} onChange={(e) => setMotherNotDeclared(e.target.checked)}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor="motherNotDeclared" className="text-sm text-gray-600 cursor-pointer select-none">
                            Mãe não declarada / ignorada
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700">
                          Nome do Pai {!fatherNotDeclared && <span className="text-red-500">*</span>}
                        </label>
                        <input 
                          type="text" required={!fatherNotDeclared} disabled={fatherNotDeclared} value={nomePai} onChange={(e) => setNomePai(e.target.value)}
                          className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-all" 
                          style={{ opacity: fatherNotDeclared ? 0.7 : 1 }}
                          placeholder="Nome completo do pai" 
                        />
                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="checkbox" id="fatherNotDeclared" checked={fatherNotDeclared} onChange={(e) => setFatherNotDeclared(e.target.checked)}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                          />
                          <label htmlFor="fatherNotDeclared" className="text-sm text-gray-600 cursor-pointer select-none">
                            Pai não declarado / ignorado
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- 4. CONTATO E ENDEREÇO --- */}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 md:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                      <MapPin className="text-blue-500" size={20} />
                      <h3 className="text-lg font-bold text-textBase">Contato e Endereço</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          Celular / Telefone <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="tel" required maxLength={15} value={telefone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length > 11) val = val.substring(0, 11)
                            if (val.length > 10) val = val.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
                            else if (val.length > 6) val = val.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
                            else if (val.length > 2) val = val.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
                            setTelefone(val)
                          }}
                          className="mt-1.5 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm shadow-sm" 
                          placeholder="(00) 00000-0000" 
                        />
                      </div>
                      <div>
                        <label className="flex justify-between items-end text-sm font-semibold text-gray-700">
                          <span>CEP <span className="text-red-500">*</span></span>
                          {loadingCep && <span className="text-blue-600 text-xs flex items-center gap-1 font-medium"><Loader2 className="animate-spin w-3 h-3"/> Buscando...</span>}
                        </label>
                        <input 
                          type="text" required maxLength={9} value={cep} onChange={handleCepChange}
                          className={`mt-1.5 block w-full px-3 py-2.5 border rounded-xl focus:ring-primary focus:border-primary text-sm shadow-sm transition-colors ${loadingCep ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'}`} 
                          placeholder="00000-000" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-9">
                        <label className="block text-sm font-medium text-gray-700">Logradouro (Rua/Avenida) <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required value={rua} onChange={(e) => setRua(e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-gray-50 text-sm" 
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-bold text-gray-900">Número <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required value={numero} onChange={(e) => setNumero(e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm shadow-sm" 
                          placeholder="Ex: 123" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Complemento</label>
                        <input 
                          type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-primary focus:border-primary bg-white text-sm" 
                          placeholder="Apto, Casa 2..." 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bairro <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required value={bairro} onChange={(e) => setBairro(e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-gray-50 text-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                      <div className="md:col-span-9">
                        <label className="block text-sm font-medium text-gray-700">Cidade <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-gray-50 text-sm" 
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">UF <span className="text-red-500">*</span></label>
                        <input 
                          type="text" required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())}
                          className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary bg-gray-50 text-sm uppercase text-center" 
                          placeholder="PR"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* BOTAO DE SUBMIT (Ação Primária) */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={20} />
                  ) : isSignUp ? (
                    <><UserPlus className="mr-2" size={20} /> Cadastrar Paciente</>
                  ) : (
                    <><LogIn className="mr-2" size={20} /> Entrar no Portal</>
                  )}
                </button>
              </div>
            </form>
          )}

          {!success && (
            <div className="mt-8 text-center">
              <button 
                type="button"
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium"
              >
                <ChevronLeft size={16} /> Voltar para o Início
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
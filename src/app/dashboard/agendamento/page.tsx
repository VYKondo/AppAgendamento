'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAgendamentoStore } from '@/store/useAgendamentoStore'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEY_PATIENT_TOKEN, STORAGE_KEY_AGENDAMENTOS } from '@/lib/storage'
import {
  ArrowLeft, ArrowRight, CalendarDays,
  ChevronLeft, ChevronRight, Loader2, Clock,
  UserCircle, CheckCircle2, FileText, MapPin, User,
  Check, Info, AlertTriangle, XCircle, X, Stethoscope
} from 'lucide-react'
import { C } from '@/styles/palette'

// ─── Tipos ──────────────────────────────────────────────────────
type EscalaMedica = {
  idx: number
  id: string
  profissional: string
  horarios: string[]
  data: string // formato: "YYYY-MM-DD"
}

type Profissional = {
  nome: string
  municipio: string
  iniciais: string
}

// ─── Constantes ─────────────────────────────────────────────────
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// ─── Helpers ────────────────────────────────────────────────────
const formatarTelefone = (value: string) => {
  if (!value) return ''
  value = value.replace(/\D/g, '')
  value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
  value = value.replace(/(\d{5})(\d)/, '$1-$2')
  return value.substring(0, 15)
}

const gerarIniciais = (nome: string): string => {
  const partes = nome.trim().split(' ')
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase()
  return nome.substring(0, 2).toUpperCase()
}

// ─── Helpers de estilo ──────────────────────────────────────────
const stepNumCls = (state: 'done' | 'active' | 'idle') => {
  const base = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200 font-heading'
  if (state === 'done')   return `${base} text-white`
  if (state === 'active') return `${base} text-white`
  return `${base} border border-gray-200`
}
const stepNumStyle = (state: 'done' | 'active' | 'idle') => {
  if (state === 'done')   return { background: C.pink400 }
  if (state === 'active') return { background: C.pink600 }
  return { background: '#fff', color: C.gray400 }
}

// ─── Componente principal ────────────────────────────────────────
export default function AgendamentoPage() {
  const router = useRouter()
  const { formData, setFormData } = useAgendamentoStore()
  const [loading, setLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<{
    message: string; type: 'error' | 'warning' | 'success' | 'info'; id: number
  } | null>(null)

  const showToast = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'warning') => {
    setToast({ message, type, id: Date.now() })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Sessão
  const [isAuthUser, setIsAuthUser] = useState(false)
  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthUser(!!session)
    }
    verificarSessao()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthUser(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Confirmação
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const [protocolo, setProtocolo] = useState('')

  // CPF / status paciente
  const [cpf, setCpf] = useState('')
  const [statusPaciente, setStatusPaciente] = useState<'pendente' | 'novo' | 'existente'>('pendente')
  const [verificandoCpf, setVerificandoCpf] = useState(false)

  // Profissionais — carregados dinamicamente do banco
  const [listaProfissionais, setListaProfissionais] = useState<Profissional[]>([])
  const [carregandoProfissionais, setCarregandoProfissionais] = useState(true)
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('')

  // Escalas e vagas
  const [escalas, setEscalas] = useState<EscalaMedica[]>([])
  const [carregandoEscalas, setCarregandoEscalas] = useState(false)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)

  // Dados pessoais
  const [nomeCompleto,      setNomeCompleto]      = useState('')
  const [nomeSocial,        setNomeSocial]        = useState('')
  const [cns,               setCns]               = useState('')
  const [dataNascimento,    setDataNascimento]    = useState('')
  const [nacionalidade,     setNacionalidade]     = useState('')
  const [identidadeGenero,  setIdentidadeGenero]  = useState('')
  const [orientacaoSexual,  setOrientacaoSexual]  = useState('')
  const [nomeMae,           setNomeMae]           = useState('')
  const [motherNotDeclared, setMotherNotDeclared] = useState(false)
  const [nomePai,           setNomePai]           = useState('')
  const [fatherNotDeclared, setFatherNotDeclared] = useState(false)

  // Contato / endereço
  const [telefone,    setTelefone]    = useState('')
  const [cep,         setCep]         = useState('')
  const [rua,         setRua]         = useState('')
  const [numero,      setNumero]      = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro,      setBairro]      = useState('')
  const [cidade,      setCidade]      = useState('')
  const [uf,          setUf]          = useState('')
  const [loadingCep,  setLoadingCep]  = useState(false)

  // Calendário
  const [currentDate, setCurrentDate] = useState(new Date())
  const currentYear       = currentDate.getFullYear()
  const currentMonth      = currentDate.getMonth()
  const diasNoMes         = new Date(currentYear, currentMonth + 1, 0).getDate()
  const primeiroDiaDoMes  = new Date(currentYear, currentMonth, 1).getDay()
  const espacosVazios     = Array.from({ length: primeiroDiaDoMes })
  const dias              = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  // ─── Carregar profissionais únicos (Fixos) ──
  useEffect(() => {
    const profissionais: Profissional[] = [
      { nome: 'Adriana', municipio: 'Ribeirão', iniciais: 'AD' },
      { nome: 'Gleiciane', municipio: 'Grandes Rios', iniciais: 'GL' },
      { nome: 'Carlos', municipio: 'Flórida', iniciais: 'CA' }
    ]
    setListaProfissionais(profissionais)
    setCarregandoProfissionais(false)
  }, [])

  // ─── Carregar escalas quando o profissional muda ──────────────
  useEffect(() => {
    if (!profissionalSelecionado) {
      setEscalas([])
      setFormData({ dia: '', horario: '' })
      return
    }

    const carregarEscalas = async () => {
      setCarregandoEscalas(true)
      try {
        // Carrega todas as escalas do profissional (datas específicas)
        const { data, error } = await supabase
          .from('escalas_medicas')
          .select('*')
          .eq('profissional', profissionalSelecionado)
          .order('data', { ascending: true })

        if (error) throw error
        setEscalas(data ?? [])
      } catch {
        showToast('Erro ao carregar agenda do profissional.', 'error')
      } finally {
        setCarregandoEscalas(false)
      }
    }
    carregarEscalas()
    // Limpa seleção ao trocar de profissional
    setFormData({ dia: '', horario: '' })
  }, [profissionalSelecionado])

  // ─── Verifica se um dia está disponível na escala ─────────────
  const isDiaDisponivel = useCallback((dataStr: string): boolean => {
    if (!profissionalSelecionado || escalas.length === 0) return false
    
    // Busca escala para a data exata (formato YYYY-MM-DD)
    return escalas.some(escala => escala.data === dataStr && escala.horarios.length > 0)
  }, [profissionalSelecionado, escalas])

  // ─── Carregar horários disponíveis (escala - agendados) ───────
  const carregarHorariosDisponiveis = useCallback(async (dataStr: string) => {
    if (!profissionalSelecionado || !dataStr) {
      setHorariosDisponiveis([])
      return
    }

    setCarregandoHorarios(true)
    try {
      // Busca a escala específica para a data selecionada
      const { data: escalaDoDia, error: errorEscala } = await supabase
        .from('escalas_medicas')
        .select('horarios')
        .eq('profissional', profissionalSelecionado)
        .eq('data', dataStr)
        .maybeSingle()

      if (errorEscala) throw errorEscala

      // Se não houver escala para esta data, não há horários
      if (!escalaDoDia || !escalaDoDia.horarios || escalaDoDia.horarios.length === 0) {
        setHorariosDisponiveis([])
        return
      }

      // Normaliza horários para HH:MM
      // ✅ FIX: Adicionado <string> para tipar explicitamente o Set
      const horariosEscala = new Set<string>(
        escalaDoDia.horarios.map((h: string) => h.substring(0, 5))
      )

      // Horários já agendados naquele dia para aquele profissional
      const { data: agendados, error: errorAgendados } = await supabase
        .from('agendamentos')
        .select('horario_agendamento')
        .eq('profissional', profissionalSelecionado)
        .eq('data_agendamento', dataStr)
        .in('status', ['agendado', 'aguardando', 'em_atendimento'])

      if (errorAgendados) throw errorAgendados

      const horariosOcupados = new Set<string>(
        (agendados ?? []).map((a: { horario_agendamento: string }) =>
          a.horario_agendamento.substring(0, 5)
        )
      )

      // Subtrai ocupados dos disponíveis
      // ✅ Agora ambos os Sets são <string>, então o filter funciona
      const livres = [...horariosEscala]
        .filter(h => !horariosOcupados.has(h))
        .sort()

      setHorariosDisponiveis(livres)
    } catch {
      showToast('Erro ao verificar horários disponíveis.', 'error')
      setHorariosDisponiveis([])
    } finally {
      setCarregandoHorarios(false)
    }
  }, [profissionalSelecionado])

  // Recarrega horários quando a data ou as escalas mudam
  useEffect(() => {
    if (formData.dia) {
      carregarHorariosDisponiveis(formData.dia)
    } else {
      setHorariosDisponiveis([])
    }
  }, [formData.dia, carregarHorariosDisponiveis])

  // ─── Handlers ────────────────────────────────────────────────
  const handleMudarMes = (direcao: 'anterior' | 'proximo') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      direcao === 'anterior' ? d.setMonth(prev.getMonth() - 1) : d.setMonth(prev.getMonth() + 1)
      return d
    })
  }

  const handleSelecionarDia = (dataStr: string) => {
    if (!isDiaDisponivel(dataStr)) return
    setFormData({ ...formData, dia: dataStr, horario: '' })
  }

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length > 5) valor = valor.replace(/^(\d{5})(\d)/, '$1-$2')
    setCep(valor)
    const clean = valor.replace(/\D/g, '')
    if (clean.length === 8) {
      setLoadingCep(true)
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setRua(data.logradouro)
          setBairro(data.bairro)
          setCidade(data.localidade)
          setUf(data.uf)
        }
      } catch { /* silencioso */ }
      finally { setLoadingCep(false) }
    }
  }

  const verificarHorarioPassado = (horaStr: string): boolean => {
    if (!formData.dia) return false
    const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const [ano, mes, dia] = formData.dia.split('-').map(Number)
    const [hora, minuto]  = horaStr.split(':').map(Number)
    return new Date(ano, mes - 1, dia, hora, minuto) <= agora
  }

  const handleVerificarCpf = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      showToast('Por favor, digite um CPF válido com 11 números.', 'warning')
      return
    }
    setVerificandoCpf(true)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('nome_completo, telefone')
        .eq('cpf', cpfLimpo)
        .single()

      if (data) {
        setNomeCompleto(data.nome_completo || 'Paciente')
        setStatusPaciente('existente')
      } else {
        setStatusPaciente('novo')
        showToast('CPF não encontrado. Por favor, preencha a ficha do paciente.', 'info')
      }
    } catch (error: any) {
      if (error.code === 'PGRST116') {
        setStatusPaciente('novo')
        showToast('CPF não encontrado. Por favor, preencha a ficha do paciente.', 'info')
      } else {
        showToast('Erro de conexão ao verificar o CPF.', 'error')
      }
    } finally {
      setVerificandoCpf(false)
    }
  }

  const handleAvancar = async () => {
    if (statusPaciente === 'pendente') {
      showToast('Por favor, identifique-se com o seu CPF primeiro.', 'warning'); return
    }
    if (!profissionalSelecionado) {
      showToast('Por favor, selecione o profissional e município de atendimento.', 'warning'); return
    }
    if (!formData.dia || !formData.horario) {
      showToast('Selecione uma data e um horário no calendário para continuar.', 'warning'); return
    }
    if (statusPaciente === 'novo') {
      if (!nomeCompleto || !dataNascimento || !cns || !telefone || !rua || !numero || !bairro || !cidade || !uf) {
        showToast('Preencha todos os campos obrigatórios (*) marcados.', 'warning'); return
      }
    }

    setLoading(true)
    const cpfLimpo = cpf.replace(/\D/g, '')
    try {
      if (statusPaciente === 'novo') {
        const { error: ep } = await supabase.from('pacientes').insert([{
          cpf: cpfLimpo,
          nome_completo: nomeCompleto,
          nome_social: nomeSocial,
          cns,
          data_nascimento: dataNascimento,
          telefone: telefone.replace(/\D/g, ''),
          identidade_genero: identidadeGenero,
          orientacao_sexual: orientacaoSexual,
          nacionalidade,
          nome_mae: motherNotDeclared ? 'Não declarado' : nomeMae,
          nome_pai: fatherNotDeclared ? 'Não declarado' : nomePai,
          cep: cep.replace(/\D/g, ''),
          logradouro: rua,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
        }])
        if (ep) throw ep
      }

      const { error: ea } = await supabase.from('agendamentos').insert([{
        paciente_cpf: cpfLimpo,
        data_agendamento: formData.dia,
        // Garante formato HH:MM:SS exigido pelo banco
        horario_agendamento: `${formData.horario}:00`,
        profissional: profissionalSelecionado,
        // Status inicial correto conforme enum do sistema
        status: 'agendado',
      }])
      if (ea) {
        // Captura violação de UNIQUE (double-booking)
        if ((ea as any).code === '23505') {
          showToast('Este horário acabou de ser reservado por outro paciente. Por favor, escolha outro.', 'warning')
          // Recarrega os horários para refletir a mudança
          await carregarHorariosDisponiveis(formData.dia)
          setFormData({ ...formData, horario: '' })
          return
        }
        throw ea
      }

      // Salva token e cópia do agendamento no localStorage apenas para pacientes (não staff autenticado)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        localStorage.setItem(STORAGE_KEY_PATIENT_TOKEN, cpfLimpo)

        // Persiste o agendamento localmente para a página "Meu Agendamento"
        const raw = localStorage.getItem(`${STORAGE_KEY_AGENDAMENTOS}_${cpfLimpo}`)
        let lista = raw ? JSON.parse(raw) : []
        const novoAgendamento = {
          id: '',
          data_agendamento: formData.dia,
          horario_agendamento: `${formData.horario}:00`,
          status: 'agendado',
          profissional: profissionalSelecionado,
        }
        lista.push(novoAgendamento)
        localStorage.setItem(`${STORAGE_KEY_AGENDAMENTOS}_${cpfLimpo}`, JSON.stringify(lista))
      }

      setProtocolo(`#AGD-${Math.floor(Math.random() * 9000) + 1000}`)
      setMostrarConfirmacao(true)
    } catch (error) {
      showToast('Ocorreu um erro ao salvar o agendamento. Tente novamente.', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetarFormulario = () => {
    setStatusPaciente('pendente')
    setCpf('')
    setNomeCompleto('')
    setNomeSocial('')
    setCns('')
    setDataNascimento('')
    setTelefone('')
    setCep('')
    setRua('')
    setNumero('')
    setBairro('')
    setCidade('')
    setUf('')
    setComplemento('')
    setNomeMae('')
    setNomePai('')
    setMotherNotDeclared(false)
    setFatherNotDeclared(false)
    setProfissionalSelecionado('')
    setEscalas([])
    setHorariosDisponiveis([])
    setFormData({ dia: '', horario: '' })
  }

  const handleFecharConfirmacaoEVoltar = () => {
    setMostrarConfirmacao(false)
    resetarFormulario()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dataFormatada = formData.dia ? formData.dia.split('-').reverse().join('/') : ''
  const passo = mostrarConfirmacao ? 3 : statusPaciente !== 'pendente' ? 2 : 1

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-sm font-medium ${
            toast.type === 'error'   ? 'bg-red-50/95 border-red-200 text-red-800' :
            toast.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800' :
            toast.type === 'info'    ? 'bg-sky-50/95 border-sky-200 text-sky-800' :
            'bg-amber-50/95 border-amber-200 text-amber-800'
          }`}>
            {toast.type === 'error'   && <XCircle       size={18} className="shrink-0 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle  size={18} className="shrink-0 text-amber-500" />}
            {toast.type === 'success' && <CheckCircle2   size={18} className="shrink-0 text-green-500" />}
            {toast.type === 'info'    && <Info            size={18} className="shrink-0 text-sky-500" />}
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      {/* ── Página ── */}
      <section className="animate-fade-in print:hidden">

        {/* Voltar + Título */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors group"
            style={{ color: C.gray400 }}
            onMouseEnter={e => (e.currentTarget.style.color = C.pink600)}
            onMouseLeave={e => (e.currentTarget.style.color = C.gray400)}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao início
          </button>

          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-textBase tracking-tight mb-1">
            Novo Agendamento
          </h1>
          <p className="text-gray-500 text-sm">Identifique-se e escolha o melhor horário para você.</p>
        </div>

        {/* ── Barra de progresso ── */}
        <div className="flex items-center gap-0 mb-8">
          {[
            { n: 1, label: 'Identificação' },
            { n: 2, label: 'Agendamento' },
            { n: 3, label: 'Confirmação' },
          ].map(({ n, label }, i) => {
            const state = n < passo ? 'done' : n === passo ? 'active' : 'idle'
            return (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={stepNumCls(state)} style={stepNumStyle(state)}>
                    {state === 'done' ? <Check size={12} strokeWidth={3} /> : n}
                  </div>
                  <span
                    className="text-xs font-semibold font-heading hidden sm:block whitespace-nowrap"
                    style={{ color: state === 'active' ? C.pink600 : state === 'done' ? C.pink400 : C.gray400 }}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className="h-px mx-3 w-8 sm:w-14 transition-all duration-500"
                    style={{ background: n < passo ? C.pink400 : C.gray200 }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Layout principal ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Coluna esquerda */}
          <div className="w-full lg:w-2/3 space-y-5">

            {/* ══ CARD: IDENTIFICAÇÃO ══ */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 transition-all hover:shadow-md">
              <h2 className="font-heading font-bold text-base mb-5 flex items-center gap-2" style={{ color: C.gray800 }}>
                <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                  <UserCircle size={16} style={{ color: C.pink600 }} />
                </span>
                Identificação do Paciente
              </h2>

              {statusPaciente === 'pendente' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: C.gray600 }}>
                      CPF do paciente
                    </label>
                    <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
                        <input
                          type="text" placeholder="000.000.000-00" maxLength={14} value={cpf}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g, '')
                            if (v.length > 11) v = v.substring(0, 11)
                            if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
                            else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
                            else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2')
                            setCpf(v)
                          }}
                          onKeyDown={e => e.key === 'Enter' && handleVerificarCpf()}
                          className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                          style={{ borderColor: C.gray200 }}
                          onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pink50}` }}
                          onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = 'none' }}
                        />
                      </div>
                      <button
                        onClick={handleVerificarCpf}
                        disabled={cpf.replace(/\D/g, '').length < 11 || verificandoCpf}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white font-heading transition-all disabled:opacity-50"
                        style={{ background: C.pink600 }}
                        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = C.pink800 }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.pink600 }}
                      >
                        {verificandoCpf ? <Loader2 size={15} className="animate-spin" /> : 'Verificar'}
                      </button>
                    </div>
                    <p className="text-xs mt-2" style={{ color: C.gray400 }}>
                      Utilizamos o CPF para consultar ou criar o seu cadastro no sistema.
                    </p>
                  </div>
                </div>
              )}

              {statusPaciente === 'existente' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: C.pink50, borderColor: C.pink100 }}>
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" style={{ color: C.pink600 }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: C.pink800 }}>Cadastro encontrado</p>
                      <p className="text-sm" style={{ color: C.pink600 }}>
                        Paciente: <strong>{nomeCompleto}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetarFormulario}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: C.gray400 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.pink600}
                    onMouseLeave={e => e.currentTarget.style.color = C.gray400}
                  >
                    <ArrowLeft size={12} /> Trocar CPF
                  </button>
                </div>
              )}

              {statusPaciente === 'novo' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                  <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                    <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Primeira consulta</p>
                      <p className="text-sm text-blue-700">CPF não encontrado. Preencha a ficha abaixo para criar o cadastro.</p>
                    </div>
                  </div>
                  <button
                    onClick={resetarFormulario}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: C.gray400 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.pink600}
                    onMouseLeave={e => e.currentTarget.style.color = C.gray400}
                  >
                    <ArrowLeft size={12} /> Trocar CPF
                  </button>
                </div>
              )}
            </div>

            {/* ══ FICHA NOVO PACIENTE ══ */}
            {statusPaciente === 'novo' && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-500 transition-all hover:shadow-md">
                <h2 className="font-heading font-bold text-base mb-5 flex items-center gap-2" style={{ color: C.gray800 }}>
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                    <FileText size={16} style={{ color: C.pink600 }} />
                  </span>
                  Dados Pessoais
                </h2>

                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: C.gray400 }}>
                  Informações básicas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>
                      Nome completo <span style={{ color: C.pink600 }}>*</span>
                    </label>
                    <input type="text" required value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)}
                      placeholder="Nome conforme documento"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>Nome Social</label>
                    <input type="text" value={nomeSocial} onChange={e => setNomeSocial(e.target.value)}
                      placeholder="Como prefere ser chamado"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>
                      Data de nasc. <span style={{ color: C.pink600 }}>*</span>
                    </label>
                    <input type="date" required max={new Date().toISOString().split('T')[0]}
                      value={dataNascimento} onChange={e => setDataNascimento(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all text-gray-700"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>Nacionalidade</label>
                    <input type="text" value={nacionalidade} onChange={e => setNacionalidade(e.target.value)}
                      placeholder="Ex: Brasileira"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>
                      CNS — Cartão Nacional de Saúde <span style={{ color: C.pink600 }}>*</span>
                    </label>
                    <input type="text" required maxLength={15} value={cns}
                      onChange={e => setCns(e.target.value.replace(/\D/g, ''))}
                      placeholder="000 0000 0000 0000"
                      className="w-full md:w-1/2 px-3 py-2.5 border rounded-xl text-sm outline-none transition-all font-mono"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>Identidade de Gênero</label>
                    <input type="text" value={identidadeGenero} onChange={e => setIdentidadeGenero(e.target.value)}
                      placeholder="Ex: Mulher Cis, Homem Trans..."
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>Orientação Sexual</label>
                    <input type="text" value={orientacaoSexual} onChange={e => setOrientacaoSexual(e.target.value)}
                      placeholder="Ex: Heterossexual, Lésbica..."
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                </div>

                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: C.gray400 }}>Filiação</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: C.gray600 }}>Nome da Mãe</label>
                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                        <input type="checkbox" checked={motherNotDeclared}
                          onChange={e => setMotherNotDeclared(e.target.checked)}
                          className="rounded text-pink-600"
                        />
                        Não declarado
                      </label>
                    </div>
                    <input type="text" disabled={motherNotDeclared}
                      value={motherNotDeclared ? '' : nomeMae}
                      onChange={e => setNomeMae(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none disabled:bg-gray-50"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold" style={{ color: C.gray600 }}>Nome do Pai</label>
                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                        <input type="checkbox" checked={fatherNotDeclared}
                          onChange={e => setFatherNotDeclared(e.target.checked)}
                          className="rounded text-pink-600"
                        />
                        Não declarado
                      </label>
                    </div>
                    <input type="text" disabled={fatherNotDeclared}
                      value={fatherNotDeclared ? '' : nomePai}
                      onChange={e => setNomePai(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none disabled:bg-gray-50"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 mb-5" />

                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: C.gray400 }}>
                  Contato e endereço
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>
                      Telefone <span style={{ color: C.pink600 }}>*</span>
                    </label>
                    <input type="tel" required value={telefone}
                      onChange={e => setTelefone(formatarTelefone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                      style={{ borderColor: C.gray200 }}
                      onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pink50}` }}
                      onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>
                      CEP {loadingCep && <Loader2 size={11} className="inline animate-spin ml-1" />}
                      <span style={{ color: C.pink600 }}> *</span>
                    </label>
                    <input type="text" required maxLength={9} value={cep} onChange={handleCepChange}
                      placeholder="00000-000"
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>
                      Rua e número <span style={{ color: C.pink600 }}>*</span>
                    </label>
                    <div className="flex gap-2">
                      <input type="text" required value={rua} onChange={e => setRua(e.target.value)}
                        placeholder="Logradouro"
                        className="flex-1 px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                        style={{ borderColor: C.gray200 }}
                      />
                      <input type="text" required value={numero} onChange={e => setNumero(e.target.value)}
                        placeholder="Nº"
                        className="w-20 px-3 py-2.5 border rounded-xl text-sm outline-none transition-all text-center"
                        style={{ borderColor: C.gray200 }}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.gray600 }}>Complemento</label>
                    <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)}
                      placeholder="Apto, Bloco, Casa..."
                      className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
                      style={{ borderColor: C.gray200 }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <input type="text" required value={bairro} onChange={e => setBairro(e.target.value)}
                        placeholder="Bairro"
                        className="flex-1 px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                        style={{ borderColor: C.gray200 }}
                      />
                      <input type="text" required value={cidade} onChange={e => setCidade(e.target.value)}
                        placeholder="Cidade"
                        className="flex-1 px-3 py-2.5 border rounded-xl text-sm outline-none transition-all"
                        style={{ borderColor: C.gray200 }}
                      />
                      <input type="text" required value={uf}
                        onChange={e => setUf(e.target.value.toUpperCase())}
                        placeholder="UF"
                        className="w-16 px-3 py-2.5 border rounded-xl text-sm outline-none transition-all text-center uppercase"
                        style={{ borderColor: C.gray200 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ CARD: PROFISSIONAL ══ */}
            {statusPaciente !== 'pendente' && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 animate-in slide-in-from-bottom-3 fade-in duration-400 transition-all hover:shadow-md">
                <h2 className="font-heading font-bold text-base mb-1 flex items-center gap-2" style={{ color: C.gray800 }}>
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                    <Stethoscope size={16} style={{ color: C.pink600 }} />
                  </span>
                  Local de Atendimento
                </h2>
                <p className="text-xs mb-5 ml-9" style={{ color: C.gray400 }}>
                  Selecione a unidade ou o profissional desejado.
                </p>

                {carregandoProfissionais ? (
                  <div className="flex items-center justify-center py-8 gap-2" style={{ color: C.gray400 }}>
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Carregando profissionais...</span>
                  </div>
                ) : listaProfissionais.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: C.gray200 }}>
                    <Stethoscope size={28} className="mb-2" style={{ color: C.gray200 }} />
                    <p className="text-sm font-medium" style={{ color: C.gray400 }}>Nenhum profissional disponível</p>
                    <p className="text-xs mt-0.5" style={{ color: C.gray200 }}>Verifique as escalas cadastradas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {listaProfissionais.map(prof => {
                      // Reconstrói o nome completo no mesmo formato salvo no banco
                      const nomeCompleto = prof.municipio
                        ? `${prof.nome} (${prof.municipio})`
                        : prof.nome
                      const selected = profissionalSelecionado === nomeCompleto
                      return (
                        <button
                          key={nomeCompleto}
                          onClick={() => setProfissionalSelecionado(nomeCompleto)}
                          className="flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-150 cursor-pointer"
                          style={{
                            borderColor: selected ? C.pink400 : C.gray200,
                            background:  selected ? C.pink50  : '#fff',
                            boxShadow:   selected ? `0 0 0 2px ${C.pink200}` : 'none',
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading shrink-0"
                            style={{
                              background: selected ? C.pink400 : C.gray100,
                              color:      selected ? '#fff'    : C.gray600,
                            }}
                          >
                            {prof.iniciais}
                          </div>
                          <div>
                            <p className="text-sm font-semibold font-heading" style={{ color: selected ? C.pink800 : C.gray800 }}>
                              {prof.nome}
                            </p>
                            {prof.municipio && (
                              <p className="text-xs" style={{ color: selected ? C.pink600 : C.gray400 }}>
                                {prof.municipio}
                              </p>
                            )}
                          </div>
                          {selected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: C.pink100, color: C.pink800 }}>
                              <Check size={10} strokeWidth={3} /> Selecionado
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ CARD: CALENDÁRIO ══ */}
            {statusPaciente !== 'pendente' && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-500 transition-all hover:shadow-md">
                <h2 className="font-heading font-bold text-base mb-6 flex items-center gap-2" style={{ color: C.gray800 }}>
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                    <CalendarDays size={16} style={{ color: C.pink600 }} />
                  </span>
                  Data e Horário
                  {carregandoEscalas && (
                    <Loader2 size={14} className="animate-spin ml-auto" style={{ color: C.gray400 }} />
                  )}
                </h2>

                {/* Aviso quando nenhum profissional selecionado */}
                {!profissionalSelecionado && (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed" style={{ borderColor: C.gray200 }}>
                    <Stethoscope size={28} className="mb-2" style={{ color: C.gray200 }} />
                    <p className="text-sm font-medium" style={{ color: C.gray400 }}>Selecione um profissional acima</p>
                    <p className="text-xs mt-0.5" style={{ color: C.gray200 }}>para ver as datas disponíveis</p>
                  </div>
                )}

                {profissionalSelecionado && !carregandoEscalas && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Calendário */}
                    <div>
                      <div className="flex justify-between items-center mb-4 px-1">
                        <button
                          onClick={() => handleMudarMes('anterior')}
                          className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all"
                          style={{ borderColor: C.gray200, color: C.gray600 }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.pink50; e.currentTarget.style.borderColor = C.pink200; e.currentTarget.style.color = C.pink600 }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray600 }}
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <h3 className="font-heading font-semibold text-sm capitalize" style={{ color: C.gray800 }}>
                          {MESES[currentMonth]} {currentYear}
                        </h3>
                        <button
                          onClick={() => handleMudarMes('proximo')}
                          className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all"
                          style={{ borderColor: C.gray200, color: C.gray600 }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.pink50; e.currentTarget.style.borderColor = C.pink200; e.currentTarget.style.color = C.pink600 }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray600 }}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 text-center mb-1">
                        {['D','S','T','Q','Q','S','S'].map((d, i) => (
                          <div key={i} className="text-xs font-bold py-1" style={{ color: C.gray400 }}>{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-0.5">
                        {espacosVazios.map((_, i) => <div key={`e-${i}`} />)}
                        {dias.map(dia => {
                          const dataStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                          const isSel   = formData.dia === dataStr
                          const hoje    = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
                          hoje.setHours(0, 0, 0, 0)
                          const dataAtual = new Date(currentYear, currentMonth, dia)
                          const isPast  = dataAtual < hoje
                          // Disponível se tiver escala para a data exata e não for passado
                          const isDisp  = !isPast && isDiaDisponivel(dataStr)
                          const isBlocked = !isPast && !isDisp

                          return (
                            <button
                              key={dia}
                              onClick={() => isDisp && handleSelecionarDia(dataStr)}
                              disabled={!isDisp}
                              title={isBlocked ? 'Sem atendimento neste dia' : undefined}
                              className="h-9 flex items-center justify-center rounded-xl text-sm transition-all duration-150 relative"
                              style={{
                                background: isSel ? C.pink600 : 'transparent',
                                color:      isSel ? '#fff'
                                          : isPast || isBlocked ? C.gray400
                                          : C.gray800,
                                fontWeight: isSel ? 700 : 400,
                                cursor:     isDisp ? 'pointer' : 'not-allowed',
                                opacity:    isPast ? 0.3 : isBlocked ? 0.5 : 1,
                                // Sublinha sutil nos dias disponíveis
                                textDecoration: isDisp && !isSel ? 'underline' : 'none',
                                textDecorationColor: C.pink200,
                                textUnderlineOffset: '3px',
                              }}
                              onMouseEnter={e => {
                                if (isDisp && !isSel) {
                                  e.currentTarget.style.background = C.pink50
                                  e.currentTarget.style.color = C.pink600
                                }
                              }}
                              onMouseLeave={e => {
                                if (isDisp && !isSel) {
                                  e.currentTarget.style.background = 'transparent'
                                  e.currentTarget.style.color = C.gray800
                                }
                              }}
                            >
                              {dia}
                            </button>
                          )
                        })}
                      </div>

                      {/* Legenda */}
                      <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: C.gray400 }}>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: C.pink600 }} />
                          Selecionado
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-sm inline-block border" style={{ borderColor: C.gray200 }} />
                          Sem agenda
                        </span>
                      </div>
                    </div>

                    {/* Horários */}
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase mb-4" style={{ color: C.gray400 }}>
                        <Clock size={13} style={{ color: C.pink400 }} /> Horários disponíveis
                      </h3>

                      {carregandoHorarios ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: C.gray400 }}>
                          <Loader2 size={22} className="animate-spin" style={{ color: C.pink400 }} />
                          <p className="text-xs">Verificando vagas...</p>
                        </div>
                      ) : formData.dia ? (
                        horariosDisponiveis.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                            {horariosDisponiveis.map(hora => {
                              const isPassado = verificarHorarioPassado(hora)
                              const isSel     = formData.horario === hora
                              return (
                                <button
                                  key={hora}
                                  disabled={isPassado}
                                  onClick={() => setFormData({ ...formData, horario: hora })}
                                  className="py-3 rounded-xl text-sm font-medium border transition-all duration-150"
                                  style={{
                                    borderColor: isSel ? C.pink600 : C.gray200,
                                    background:  isSel ? C.pink600 : '#fff',
                                    color:       isSel ? '#ffffff' : isPassado ? C.gray400 : C.gray600,
                                    opacity:     isPassado ? 0.4 : 1,
                                    cursor:      isPassado ? 'not-allowed' : 'pointer',
                                  }}
                                  onMouseEnter={e => {
                                    if (!isPassado && !isSel) {
                                      e.currentTarget.style.borderColor = C.pink400
                                      e.currentTarget.style.color = C.pink600
                                      e.currentTarget.style.background = C.pink50
                                    }
                                  }}
                                  onMouseLeave={e => {
                                    if (!isPassado && !isSel) {
                                      e.currentTarget.style.borderColor = C.gray200
                                      e.currentTarget.style.color = C.gray600
                                      e.currentTarget.style.background = '#fff'
                                    }
                                  }}
                                >
                                  {hora}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center py-10 rounded-xl border-2 border-dashed" style={{ borderColor: C.gray200 }}>
                            <Clock size={28} className="mb-2" style={{ color: C.gray200 }} />
                            <p className="text-sm font-medium" style={{ color: C.gray400 }}>Sem vagas disponíveis</p>
                            <p className="text-xs mt-0.5" style={{ color: C.gray200 }}>Tente outro dia</p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center py-10 rounded-xl border-2 border-dashed" style={{ borderColor: C.gray200 }}>
                          <CalendarDays size={28} className="mb-2" style={{ color: C.gray600 }} />
                          <p className="text-sm font-medium" style={{ color: C.gray400 }}>Selecione uma data ao lado</p>
                          <p className="text-xs mt-0.5" style={{ color: C.gray200 }}>para ver os horários disponíveis</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Botão finalizar ── */}
            <div className="flex flex-col items-end pt-2">
              {statusPaciente !== 'pendente' && (!formData.dia || !formData.horario || !profissionalSelecionado) && (
                <p className="flex items-center gap-1.5 text-xs font-medium mb-3 animate-pulse" style={{ color: '#D97706' }}>
                  <Info size={13} /> Selecione o local, data e horário antes de finalizar
                </p>
              )}
              <button
                onClick={handleAvancar}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold font-heading text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                style={{
                  background: loading ? C.gray400 : C.pink600,
                  boxShadow: loading ? 'none' : `0 4px 20px ${C.pink200}`,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.background = C.pink800
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = loading ? C.gray400 : C.pink600
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Salvando...</>
                  : <>Finalizar Agendamento <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sticky top-28 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                  <FileText size={15} style={{ color: C.pink600 }} />
                </div>
                <h3 className="font-heading font-bold text-sm" style={{ color: C.gray800 }}>Resumo da Consulta</h3>
              </div>

              <div className="space-y-0">
                {[
                  { label: 'Paciente',   value: nomeCompleto || (statusPaciente === 'pendente' ? '' : (cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf)) },
                  { label: 'Local / Prof.', value: profissionalSelecionado },
                  { label: 'Data',       value: dataFormatada },
                  { label: 'Horário',    value: formData.horario },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start py-2.5 border-b border-gray-50">
                    <span className="text-xs" style={{ color: C.gray400 }}>{label}</span>
                    <span className="text-xs font-semibold text-right max-w-[55%] truncate"
                      style={{ color: value ? C.gray800 : C.gray200 }}>
                      {value || '—'}
                    </span>
                  </div>
                ))}
               
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MODAL DE CONFIRMAÇÃO
      ══════════════════════════════════════════ */}
      {mostrarConfirmacao && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto print:bg-white print:p-0 print:block"
          style={{ background: 'rgba(24,24,27,0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="w-full max-w-2xl my-auto animate-in zoom-in-95 duration-300 print:shadow-none">

            <div className="flex items-center justify-between p-5 rounded-t-2xl"
              style={{ background: C.pink50, borderBottom: `1px solid ${C.pink100}` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: C.pink600 }}>
                  <Check size={26} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg" style={{ color: C.pink800 }}>Agendamento Confirmado!</h3>
                  <p className="text-sm" style={{ color: C.pink600 }}>Sua consulta foi registrada com sucesso.</p>
                </div>
              </div>
              <button
                onClick={handleFecharConfirmacaoEVoltar}
                className="p-2 rounded-full transition-colors print:hidden"
                style={{ color: C.pink400 }}
                onMouseEnter={e => { e.currentTarget.style.background = C.pink100 }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <X size={22} />
              </button>
            </div>

            <div className="bg-white rounded-b-2xl overflow-hidden shadow-2xl print:shadow-none">
              <div className="h-1.5 w-full print:hidden"
                style={{ background: `linear-gradient(90deg, ${C.pink600}, ${C.pink400})` }} />

              <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="font-heading font-bold text-2xl" style={{ color: C.gray800 }}>Comprovante</h2>
                    <p className="text-sm" style={{ color: C.gray400 }}>Guarde este documento para o dia da consulta.</p>
                  </div>
                  <div className="text-right px-4 py-2.5 rounded-xl border"
                    style={{ background: C.pink50, borderColor: C.pink100 }}>
                    <span className="block text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: C.pink400 }}>
                      Protocolo
                    </span>
                    <p className="font-mono text-sm font-bold" style={{ color: C.pink800 }}>{protocolo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} style={{ color: C.pink400 }} />
                      <p className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gray400 }}>Paciente</p>
                    </div>
                    <p className="font-heading font-semibold text-lg capitalize" style={{ color: C.gray800 }}>
                      {nomeCompleto.toLowerCase()}
                    </p>
                    <p className="text-sm" style={{ color: C.gray400 }}>CPF: {cpf}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={14} style={{ color: C.pink400 }} />
                      <p className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gray400 }}>Local e Data</p>
                    </div>
                    <p className="font-heading font-semibold text-lg" style={{ color: C.gray800 }}>
                      {dataFormatada} às {formData.horario}
                    </p>
                    <p className="text-sm font-medium" style={{ color: C.gray400 }}>{profissionalSelecionado}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl text-xs"
                  style={{ background: C.pink50, color: C.pink800, border: `1px solid ${C.pink100}` }}>
                  Em caso de dúvidas ou necessidade de cancelamento, informe o número do protocolo ao atendimento.
                </div>
              </div>

              <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold font-heading border transition-colors"
                  style={{ borderColor: C.gray200, color: C.gray600 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.gray100}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  Imprimir / PDF
                </button>
                <button
                  onClick={handleFecharConfirmacaoEVoltar}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold font-heading text-white transition-all"
                  style={{ background: C.pink600 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.pink800}
                  onMouseLeave={e => e.currentTarget.style.background = C.pink600}
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
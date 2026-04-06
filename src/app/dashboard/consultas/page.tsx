'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CalendarDays, Clock, Search, Loader2, ChevronDown, ChevronUp,
  Phone, CreditCard, Activity, MapPin, CheckCircle2, Users,
  Edit3, Save, X, AlertTriangle, XCircle, Info, Filter, Stethoscope,
  UserCircle, Hash, Home, SlidersHorizontal, FileText
} from 'lucide-react'

// ── Tipagens ────────────────────────────────────────────────────
type Paciente = {
  cpf: string
  nome_completo: string
  nome_social: string | null
  cns: string
  data_nascimento: string
  telefone: string
  identidade_genero: string | null
  orientacao_sexual: string | null
  nacionalidade: string | null
  nome_mae: string | null
  nome_pai: string | null
  cep: string
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
}

type Agendamento = {
  id: string
  paciente_cpf: string
  data_agendamento: string
  horario_agendamento: string
  status: string
  profissional: string | null
  paciente?: Paciente
}

// ── Constantes ──────────────────────────────────────────────────
const LISTA_PROFISSIONAIS = [
  'Gleiciane (município A)',
  'Carlos (município B)',
  'Adriana (município C)',
]

// ── Paleta rosa (igual ao page.tsx) ────────────────────────────
const C = {
  pink50:  '#FDF0F7',
  pink100: '#F9D0E9',
  pink200: '#F3A1D0',
  pink400: '#E84393',
  pink600: '#C73280',
  pink800: '#8B1F57',
  gray50:  '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D1D5DB',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#18181B',
  white:   '#FFFFFF',
}

// ── Sub-componentes auxiliares ──────────────────────────────────

/** Badge de status da consulta */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; border: string; color: string; icon: React.ReactNode; label: string }> = {
    pendente:   { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: <Clock size={12} />,        label: 'Pendente'   },
    confirmado: { bg: '#F0FDF4', border: '#BBF7D0', color: '#14532D', icon: <CheckCircle2 size={12} />, label: 'Confirmado' },
    cancelado:  { bg: '#FFF1F2', border: '#FECDD3', color: '#881337', icon: <XCircle size={12} />,      label: 'Cancelado'  },
  }
  const s = map[status] ?? map['pendente']
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      {s.icon} {s.label}
    </span>
  )
}

/** Avatar com iniciais */
function Avatar({ nome }: { nome: string }) {
  const iniciais = (() => {
    if (!nome) return '?'
    const p = nome.trim().split(' ')
    return p.length === 1 ? p[0].substring(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
  })()
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold font-heading"
      style={{ background: C.pink100, color: C.pink800 }}
    >
      {iniciais}
    </div>
  )
}

/** Campo de leitura na ficha */
function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold mb-0.5" style={{ color: C.gray400 }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: value ? C.gray800 : C.gray400 }}>
        {value || '—'}
      </p>
    </div>
  )
}

/** Input de edição padronizado */
function EditInput({
  value, onChange, placeholder, type = 'text', className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full text-sm px-3 py-2 rounded-lg outline-none border transition-all ${className}`}
      style={{ borderColor: C.gray200 }}
      onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pink50}` }}
      onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

// ── Página principal ────────────────────────────────────────────
export default function ConsultasPage() {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [profissionalFilter, setProfissionalFilter] = useState('todos')

  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' | 'info'; id: number } | null>(null)

  const [editingCpf, setEditingCpf] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Paciente>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const showToast = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'warning') => {
    setToast({ message, type, id: Date.now() })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => { verificarAcessoEBuscarDados() }, [])

  const verificarAcessoEBuscarDados = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return router.push('/medico')

      const { data: agendamentosData, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_agendamento', { ascending: true })
        .order('horario_agendamento', { ascending: true })

      if (error) throw error
      if (!agendamentosData || agendamentosData.length === 0) { setAgendamentos([]); return }

      const cpfs = [...new Set(agendamentosData.map((a: any) => a.paciente_cpf).filter(Boolean))]
      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes').select('*').in('cpf', cpfs)
      if (pacientesError) throw pacientesError

      setAgendamentos(agendamentosData.map((ag: any) => ({
        ...ag,
        paciente: pacientesData?.find((p: Paciente) => p.cpf === ag.paciente_cpf),
      })))
    } catch (error) {
      console.error('Erro ao carregar consultas:', error)
      showToast('Erro ao carregar os dados.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const iniciarEdicao = (paciente: Paciente) => { setEditingCpf(paciente.cpf); setEditForm(paciente) }
  const cancelarEdicao = () => { setEditingCpf(null); setEditForm({}) }

  const salvarEdicao = async () => {
    if (!editingCpf) return
    setSavingEdit(true)
    try {
      const { error } = await supabase.from('pacientes').update(editForm).eq('cpf', editingCpf)
      if (error) throw error
      showToast('Ficha do paciente atualizada com sucesso!', 'success')
      await verificarAcessoEBuscarDados()
      setEditingCpf(null)
    } catch { showToast('Erro ao atualizar os dados.', 'error') }
    finally { setSavingEdit(false) }
  }

  const alterarStatusConsulta = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id)
      if (error) throw error
      showToast(`Consulta ${novoStatus} com sucesso!`, 'success')
      verificarAcessoEBuscarDados()
    } catch { showToast('Erro ao alterar o status.', 'error') }
  }

  const alterarProfissionalConsulta = async (id: string, novoProfissional: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ profissional: novoProfissional }).eq('id', id)
      if (error) throw error
      showToast('Profissional atualizado com sucesso!', 'success')
      verificarAcessoEBuscarDados()
    } catch { showToast('Erro ao alterar profissional.', 'error') }
  }

  const formatarData = (d?: string) => d ? d.split('-').reverse().join('/') : ''
  const formatarHora = (h?: string) => h ? h.substring(0, 5) : ''
  const formatarCPF  = (c: string) => c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''

  const toggleRow = (id: string) => {
    if (editingCpf) { showToast('Guarde ou cancele as alterações antes de mudar de paciente.', 'warning'); return }
    setExpandedRow(expandedRow === id ? null : id)
  }

  const agendamentosFiltrados = agendamentos.filter(ag => {
    const nome  = ag.paciente?.nome_completo || ''
    const busca = searchTerm.toLowerCase()
    return (
      (nome.toLowerCase().includes(busca) || ag.paciente_cpf.includes(busca)) &&
      (statusFilter === 'todos' || ag.status === statusFilter) &&
      (profissionalFilter === 'todos' || ag.profissional === profissionalFilter)
    )
  })

  // ── Totais para os cards de KPI ─────────────────────────────
  const total      = agendamentos.length
  const pendentes  = agendamentos.filter(a => a.status === 'pendente').length
  const confirmados = agendamentos.filter(a => a.status === 'confirmado').length

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.pink200, borderTopColor: C.pink600 }} />
      <p className="text-sm font-medium animate-pulse" style={{ color: C.gray400 }}>Carregando painel médico…</p>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────
  return (
    <section className="animate-fade-in pb-12 relative">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-sm font-medium ${
            toast.type === 'error'   ? 'bg-red-50/95 border-red-200 text-red-800' :
            toast.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800' :
            toast.type === 'info'    ? 'bg-sky-50/95 border-sky-200 text-sky-800' :
            'bg-amber-50/95 border-amber-200 text-amber-800'
          }`}>
            {toast.type === 'error'   && <XCircle      size={17} className="shrink-0 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle size={17} className="shrink-0 text-amber-500" />}
            {toast.type === 'success' && <CheckCircle2  size={17} className="shrink-0 text-green-500" />}
            {toast.type === 'info'    && <Info          size={17} className="shrink-0 text-sky-500" />}
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          CABEÇALHO + KPIs
      ══════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                <Activity size={16} style={{ color: C.pink600 }} />
              </div>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl" style={{ color: C.gray800 }}>
                Painel de Consultas
              </h1>
            </div>
            <p className="text-sm ml-[42px]" style={{ color: C.gray400 }}>
              Pesquise, filtre e atualize os prontuários dos pacientes.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total de Consultas', value: total,      color: C.pink600, bg: C.pink50,   border: C.pink100 },
            { label: 'Pendentes',          value: pendentes,  color: '#92400E', bg: '#FFFBEB',  border: '#FDE68A' },
            { label: 'Confirmadas',        value: confirmados, color: '#14532D', bg: '#F0FDF4', border: '#BBF7D0' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border p-4 flex flex-col gap-1"
              style={{ borderColor: k.border, background: k.bg }}>
              <p className="text-xs font-semibold" style={{ color: k.color, opacity: 0.8 }}>{k.label}</p>
              <p className="text-2xl font-extrabold font-heading" style={{ color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* ── Painel de filtros ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <SlidersHorizontal size={14} style={{ color: C.gray400 }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gray400 }}>Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Busca */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
              <input
                type="text" placeholder="Buscar por nome ou CPF…"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border outline-none transition-all"
                style={{ borderColor: C.gray200, background: C.gray50 }}
                onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pink50}` }}
                onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Profissional */}
            <div className="relative">
              <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
              <select
                value={profissionalFilter} onChange={e => setProfissionalFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none cursor-pointer"
                style={{ borderColor: C.gray200, background: C.gray50 }}
                onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pink50}` }}
                onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = 'none' }}
              >
                <option value="todos">Todos os municípios</option>
                {LISTA_PROFISSIONAIS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="relative">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
              <select
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none cursor-pointer"
                style={{ borderColor: C.gray200, background: C.gray50 }}
                onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.pink50}` }}
                onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = 'none' }}
              >
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="confirmado">Confirmados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>

          </div>
          {/* Contador de resultados */}
          {(searchTerm || statusFilter !== 'todos' || profissionalFilter !== 'todos') && (
            <p className="text-xs mt-3 font-medium" style={{ color: C.gray400 }}>
              {agendamentosFiltrados.length} resultado{agendamentosFiltrados.length !== 1 ? 's' : ''} encontrado{agendamentosFiltrados.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TABELA — Desktop
      ══════════════════════════════════════════ */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ background: C.gray50, borderBottom: `1px solid ${C.gray100}` }}>
              <tr>
                {['Paciente', 'Data e Hora', 'Profissional / Local', 'Status', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-3.5 text-xs font-bold tracking-widest uppercase ${i === 4 ? 'text-right' : ''}`}
                    style={{ color: C.gray400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.gray100 }}>
              {agendamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center" style={{ color: C.gray400 }}>
                    <FileText size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Nenhum agendamento encontrado com estes filtros.</p>
                  </td>
                </tr>
              ) : agendamentosFiltrados.map(ag => {
                const isExpanded    = expandedRow === ag.id
                const paciente      = ag.paciente
                const isEditingThis = editingCpf === ag.paciente_cpf
                const nome = paciente?.nome_completo || 'Paciente Não Identificado'
                const cpf  = ag.paciente_cpf ? formatarCPF(ag.paciente_cpf) : 'Sem CPF'

                return (
                  <Fragment key={ag.id}>

                    {/* ── Linha principal ── */}
                    <tr
                      onClick={() => toggleRow(ag.id)}
                      className="transition-colors cursor-pointer group"
                      style={{ background: isExpanded ? C.pink50 : C.white }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = C.gray50 }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = C.white }}
                    >
                      {/* Paciente */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar nome={nome} />
                          <div>
                            <p className="font-semibold text-sm" style={{ color: C.gray800 }}>{nome}</p>
                            <p className="text-xs font-mono mt-0.5" style={{ color: C.gray400 }}>CPF: {cpf}</p>
                          </div>
                        </div>
                      </td>

                      {/* Data / Hora */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays size={13} style={{ color: C.pink400 }} />
                          <span className="text-sm font-medium" style={{ color: C.gray700 }}>
                            {formatarData(ag.data_agendamento)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={13} style={{ color: C.pink200 }} />
                          <span className="text-xs" style={{ color: C.gray400 }}>
                            {formatarHora(ag.horario_agendamento)}
                          </span>
                        </div>
                      </td>

                      {/* Profissional */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope size={13} style={{ color: C.pink400 }} />
                          <span className="text-sm" style={{ color: ag.profissional ? C.gray700 : C.gray300 }}>
                            {ag.profissional ?? <em>Não atribuído</em>}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={ag.status} />
                      </td>

                      {/* Abrir ficha */}
                      <td className="px-5 py-4 text-right">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            color: isExpanded ? C.pink800 : C.pink600,
                            background: isExpanded ? C.pink100 : C.pink50,
                          }}
                        >
                          {isExpanded ? 'Recolher' : 'Abrir Ficha'}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </td>
                    </tr>

                    {/* ── Ficha expandida ── */}
                    {isExpanded && paciente && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div
                            className="animate-in slide-in-from-top-2 fade-in duration-300 px-5 py-6"
                            style={{ background: '#FDFCFD', borderBottom: `2px solid ${C.pink100}` }}
                          >

                            {/* Cabeçalho da ficha */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.pink50 }}>
                                  <FileText size={13} style={{ color: C.pink600 }} />
                                </div>
                                <h4 className="text-sm font-bold font-heading" style={{ color: C.gray700 }}>
                                  {isEditingThis ? 'Editando Ficha Cadastral' : 'Ficha Cadastral do Paciente'}
                                </h4>
                                {isEditingThis && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                    modo edição
                                  </span>
                                )}
                              </div>
                              {!isEditingThis && (
                                <button
                                  onClick={() => iniciarEdicao(paciente)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                                  style={{ color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
                                >
                                  <Edit3 size={13} /> Editar Dados
                                </button>
                              )}
                            </div>

                            {/* Grid de blocos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">

                              {/* ── Bloco: Dados Básicos ── */}
                              <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: C.gray200 }}>
                                <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: C.gray100 }}>
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.pink50 }}>
                                    <CreditCard size={13} style={{ color: C.pink600 }} />
                                  </div>
                                  <h5 className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gray500 }}>
                                    Dados Básicos
                                  </h5>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Nome completo</p>
                                    {isEditingThis
                                      ? <EditInput value={editForm.nome_completo || ''} onChange={v => setEditForm({ ...editForm, nome_completo: v })} placeholder="Nome completo" />
                                      : <p className="text-sm font-medium" style={{ color: C.gray800 }}>{paciente.nome_completo}</p>}
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>CNS — Cartão SUS</p>
                                    {isEditingThis
                                      ? <EditInput value={editForm.cns || ''} onChange={v => setEditForm({ ...editForm, cns: v })} className="font-mono" />
                                      : <p className="text-sm font-mono font-medium" style={{ color: C.gray800 }}>{paciente.cns}</p>}
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Data de nascimento</p>
                                    {isEditingThis
                                      ? <EditInput type="date" value={editForm.data_nascimento || ''} onChange={v => setEditForm({ ...editForm, data_nascimento: v })} />
                                      : <p className="text-sm font-medium" style={{ color: C.gray800 }}>{formatarData(paciente.data_nascimento)}</p>}
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Telefone</p>
                                    {isEditingThis
                                      ? <EditInput value={editForm.telefone || ''} onChange={v => setEditForm({ ...editForm, telefone: v })} placeholder="Telefone" />
                                      : <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: C.gray800 }}>
                                          <Phone size={13} style={{ color: C.pink400 }} /> {paciente.telefone}
                                        </div>}
                                  </div>
                                </div>
                              </div>

                              {/* ── Bloco: Origem e Identidade ── */}
                              <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: C.gray200 }}>
                                <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: C.gray100 }}>
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.pink50 }}>
                                    <Users size={13} style={{ color: C.pink600 }} />
                                  </div>
                                  <h5 className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gray500 }}>
                                    Origem e Identidade
                                  </h5>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Nome da mãe</p>
                                    {isEditingThis
                                      ? <EditInput value={editForm.nome_mae || ''} onChange={v => setEditForm({ ...editForm, nome_mae: v })} />
                                      : <p className="text-sm font-medium" style={{ color: C.gray800 }}>{paciente.nome_mae || '—'}</p>}
                                  </div>

                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Nome social</p>
                                    {isEditingThis
                                      ? <EditInput value={editForm.nome_social || ''} onChange={v => setEditForm({ ...editForm, nome_social: v })} />
                                      : <p className="text-sm font-medium" style={{ color: C.gray800 }}>{paciente.nome_social || '—'}</p>}
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Identidade de gênero</p>
                                      {isEditingThis
                                        ? <EditInput value={editForm.identidade_genero || ''} onChange={v => setEditForm({ ...editForm, identidade_genero: v })} />
                                        : <p className="text-sm font-medium capitalize" style={{ color: C.gray800 }}>
                                            {paciente.identidade_genero?.replace('_', ' ') || '—'}
                                          </p>}
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Nacionalidade</p>
                                      {isEditingThis
                                        ? <EditInput value={editForm.nacionalidade || ''} onChange={v => setEditForm({ ...editForm, nacionalidade: v })} />
                                        : <p className="text-sm font-medium" style={{ color: C.gray800 }}>{paciente.nacionalidade || '—'}</p>}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ── Bloco: Localização + Profissional ── */}
                              <div className="bg-white rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: C.gray200 }}>
                                <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: C.gray100 }}>
                                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.pink50 }}>
                                    <MapPin size={13} style={{ color: C.pink600 }} />
                                  </div>
                                  <h5 className="text-xs font-bold tracking-widest uppercase" style={{ color: C.gray500 }}>
                                    Localização
                                  </h5>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold mb-1.5" style={{ color: C.gray400 }}>Endereço</p>
                                    {isEditingThis ? (
                                      <div className="space-y-2">
                                        <div className="flex gap-2">
                                          <EditInput value={editForm.logradouro || ''} onChange={v => setEditForm({ ...editForm, logradouro: v })} placeholder="Logradouro" className="flex-1" />
                                          <EditInput value={editForm.numero || ''} onChange={v => setEditForm({ ...editForm, numero: v })} placeholder="Nº" className="w-16" />
                                        </div>
                                        <div className="flex gap-2">
                                          <EditInput value={editForm.bairro || ''} onChange={v => setEditForm({ ...editForm, bairro: v })} placeholder="Bairro" className="flex-1" />
                                          <EditInput value={editForm.cidade || ''} onChange={v => setEditForm({ ...editForm, cidade: v })} placeholder="Cidade" className="flex-1" />
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm font-medium leading-snug" style={{ color: C.gray800 }}>
                                        {paciente.logradouro}, {paciente.numero || 'S/N'}<br />
                                        <span style={{ color: C.gray500 }}>{paciente.bairro} · {paciente.cidade}/{paciente.uf}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Atribuição de profissional */}
                                <div
                                  className="pt-4 border-t"
                                  style={{
                                    borderColor: C.pink100,
                                    opacity: isEditingThis ? 0.35 : 1,
                                    pointerEvents: isEditingThis ? 'none' : 'auto',
                                  }}
                                >
                                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: C.pink600 }}>
                                    Profissional / Local
                                  </p>
                                  <div className="relative">
                                    <Stethoscope size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
                                    <select
                                      value={ag.profissional || ''}
                                      onChange={e => alterarProfissionalConsulta(ag.id, e.target.value)}
                                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none cursor-pointer font-medium"
                                      style={{ borderColor: C.pink200, background: C.pink50, color: C.pink800 }}
                                    >
                                      <option value="" disabled>Selecione um profissional…</option>
                                      {LISTA_PROFISSIONAIS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* ── Rodapé de ações ── */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 border-t" style={{ borderColor: C.gray100 }}>

                              {/* Ações médicas — à esquerda */}
                              <div className={`flex flex-wrap gap-2 ${isEditingThis ? 'opacity-30 pointer-events-none' : ''}`}>
                                <p className="w-full text-xs font-bold tracking-widest uppercase mb-1" style={{ color: C.gray400 }}>
                                  Ações médicas
                                </p>
                                {ag.status !== 'cancelado' && (
                                  <button
                                    onClick={() => alterarStatusConsulta(ag.id, 'cancelado')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all border"
                                    style={{ color: '#B91C1C', background: '#FFF1F2', borderColor: '#FECDD3' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FFE4E6'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#FFF1F2'}
                                  >
                                    <XCircle size={14} /> Cancelar Consulta
                                  </button>
                                )}
                                {ag.status === 'pendente' && (
                                  <button
                                    onClick={() => alterarStatusConsulta(ag.id, 'confirmado')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all text-white"
                                    style={{ background: C.pink600, boxShadow: `0 2px 10px ${C.pink200}` }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.pink800; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = C.pink600; e.currentTarget.style.transform = 'translateY(0)' }}
                                  >
                                    <CheckCircle2 size={14} /> Confirmar Atendimento
                                  </button>
                                )}
                              </div>

                              {/* Ações de formulário — à direita, só aparece em modo edição */}
                              {isEditingThis && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                                  <p className="text-xs font-bold mr-2" style={{ color: '#1E40AF' }}>Salvar alterações?</p>
                                  <button
                                    onClick={cancelarEdicao}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
                                    style={{ background: '#fff', borderColor: C.gray200, color: C.gray600 }}
                                    onMouseEnter={e => e.currentTarget.style.background = C.gray100}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                  >
                                    <X size={13} /> Descartar
                                  </button>
                                  <button
                                    onClick={salvarEdicao}
                                    disabled={savingEdit}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-all disabled:opacity-50"
                                    style={{ background: '#1D4ED8' }}
                                    onMouseEnter={e => { if (!savingEdit) e.currentTarget.style.background = '#1E3A8A' }}
                                    onMouseLeave={e => e.currentTarget.style.background = '#1D4ED8'}
                                  >
                                    {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    Salvar Dados
                                  </button>
                                </div>
                              )}

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CARDS — Mobile (< md)
      ══════════════════════════════════════════ */}
      <div className="md:hidden space-y-3">
        {agendamentosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center" style={{ color: C.gray400 }}>
            <FileText size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum agendamento encontrado.</p>
          </div>
        ) : agendamentosFiltrados.map(ag => {
          const isExpanded    = expandedRow === ag.id
          const paciente      = ag.paciente
          const isEditingThis = editingCpf === ag.paciente_cpf
          const nome = paciente?.nome_completo || 'Paciente Não Identificado'
          const cpf  = ag.paciente_cpf ? formatarCPF(ag.paciente_cpf) : 'Sem CPF'

          return (
            <div key={ag.id} className="bg-white rounded-2xl border shadow-soft overflow-hidden transition-all"
              style={{ borderColor: isExpanded ? C.pink200 : C.gray100 }}>

              {/* Cabeçalho do card */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                style={{ background: isExpanded ? C.pink50 : C.white }}
                onClick={() => toggleRow(ag.id)}
              >
                <Avatar nome={nome} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: C.gray800 }}>{nome}</p>
                  <p className="text-xs font-mono" style={{ color: C.gray400 }}>CPF: {cpf}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs" style={{ color: C.gray500 }}>
                      <CalendarDays size={11} style={{ color: C.pink400 }} />
                      {formatarData(ag.data_agendamento)} · {formatarHora(ag.horario_agendamento)}
                    </span>
                    <StatusBadge status={ag.status} />
                  </div>
                </div>
                <div style={{ color: C.pink400 }}>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Detalhes expandidos — mobile */}
              {isExpanded && paciente && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200 space-y-4"
                  style={{ borderTop: `1px solid ${C.pink100}` }}>

                  {/* Cabeçalho ficha mobile */}
                  <div className="flex items-center justify-between pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gray400 }}>
                      {isEditingThis ? 'Editando Ficha' : 'Ficha do Paciente'}
                    </h4>
                    {!isEditingThis && (
                      <button onClick={() => iniciarEdicao(paciente)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ color: '#1D4ED8', background: '#EFF6FF' }}>
                        <Edit3 size={12} /> Editar
                      </button>
                    )}
                  </div>

                  {/* Campos básicos mobile */}
                  <div className="space-y-3 p-3 rounded-xl" style={{ background: C.gray50, border: `1px solid ${C.gray100}` }}>
                    <ReadField label="Nome completo"     value={paciente.nome_completo} />
                    <ReadField label="Data de nascimento" value={formatarData(paciente.data_nascimento)} />
                    <ReadField label="Telefone"          value={paciente.telefone} />
                    <ReadField label="CNS"               value={paciente.cns} />
                    <ReadField label="Endereço"          value={`${paciente.logradouro}, ${paciente.numero || 'S/N'} — ${paciente.bairro}, ${paciente.cidade}/${paciente.uf}`} />
                  </div>

                  {/* Profissional mobile */}
                  <div style={{ opacity: isEditingThis ? 0.35 : 1, pointerEvents: isEditingThis ? 'none' : 'auto' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.pink600 }}>Profissional</p>
                    <select
                      value={ag.profissional || ''}
                      onChange={e => alterarProfissionalConsulta(ag.id, e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none appearance-none"
                      style={{ borderColor: C.pink200, background: C.pink50, color: C.pink800 }}
                    >
                      <option value="" disabled>Selecione…</option>
                      {LISTA_PROFISSIONAIS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Ações mobile */}
                  <div className="space-y-3 pt-2">
                    <div className={`flex flex-wrap gap-2 ${isEditingThis ? 'opacity-30 pointer-events-none' : ''}`}>
                      {ag.status !== 'cancelado' && (
                        <button onClick={() => alterarStatusConsulta(ag.id, 'cancelado')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border"
                          style={{ color: '#B91C1C', background: '#FFF1F2', borderColor: '#FECDD3' }}>
                          <XCircle size={14} /> Cancelar
                        </button>
                      )}
                      {ag.status === 'pendente' && (
                        <button onClick={() => alterarStatusConsulta(ag.id, 'confirmado')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-xl text-white"
                          style={{ background: C.pink600 }}>
                          <CheckCircle2 size={14} /> Confirmar
                        </button>
                      )}
                    </div>

                    {isEditingThis && (
                      <div className="flex gap-2">
                        <button onClick={cancelarEdicao}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl border"
                          style={{ background: '#fff', borderColor: C.gray200, color: C.gray600 }}>
                          <X size={13} /> Descartar
                        </button>
                        <button onClick={salvarEdicao} disabled={savingEdit}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl text-white disabled:opacity-50"
                          style={{ background: '#1D4ED8' }}>
                          {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          Salvar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </section>
  )
}
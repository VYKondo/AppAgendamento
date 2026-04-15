'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CalendarDays, Clock, Search, Loader2, ChevronDown, ChevronUp,
  Phone, MapPin, CheckCircle2,
  Edit3, Save, X, AlertTriangle, XCircle, Info, Filter, Stethoscope,
  FileText, User, Home, Heart
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
  'Gleiciane (Município A)',
  'Carlos (Município B)',
  'Adriana (Município C)',
]

// ── Paleta ──────────────────────────────────────────────────────
const C = {
  pink50:  '#FDF2F8',
  pink100: '#FCE7F3',
  pink200: '#F9D0E9',
  pink300: '#F5A6D5',
  pink400: '#E84393',
  pink500: '#D63D8A',
  pink600: '#C2185B',
  pink700: '#AD1457',
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

// ── Helpers de UI ────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
    agendado:       { bg: '#F4F4F5', color: '#52525B', icon: <CalendarDays size={11} />,  label: 'Agendado' },
    aguardando:     { bg: '#FFFBEB', color: '#D97706', icon: <Clock size={11} />,         label: 'Na Sala de Espera' },
    em_atendimento: { bg: '#EFF6FF', color: '#2563EB', icon: <Stethoscope size={11} />,   label: 'Em Atendimento' },
    finalizado:     { bg: '#ECFDF5', color: '#166534', icon: <CheckCircle2 size={11} />,  label: 'Finalizado' },
  }
  const s = map[status] ?? map['agendado']
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm border"
      style={{ background: s.bg, color: s.color, borderColor: `${s.color}30` }}>
      {s.icon} {s.label}
    </span>
  )
}

function Avatar({ nome, size = 'md' }: { nome: string; size?: 'sm' | 'md' | 'lg' }) {
  const iniciais = (() => {
    if (!nome) return '?'
    const p = nome.trim().split(' ')
    return p.length === 1 ? p[0].substring(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
  })()
  const dim = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-inner border`}
      style={{ background: C.pink50, color: C.pink600, borderColor: C.pink100 }}>
      {iniciais}
    </div>
  )
}

function ReadField({ label, value, mono, icon }: { label: string; value?: string | null; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="px-3.5 py-2.5 rounded-xl border flex flex-col justify-center h-full" 
         style={{ background: C.gray50, borderColor: C.gray100 }}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: C.gray400 }}>{label}</p>
      <div className={`flex items-start gap-1.5 text-sm font-semibold leading-snug ${mono ? 'font-mono tracking-tight text-xs mt-0.5' : ''}`} 
         style={{ color: value ? C.gray800 : C.gray400 }}>
        {icon && <span className="mt-[2px]" style={{ color: C.pink400 }}>{icon}</span>}
        <span className="break-words w-full">{value || 'Não informado'}</span>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3.5">
        <div className="p-1.5 rounded-lg" style={{ background: C.pink50 }}>
          <span style={{ color: C.pink500 }}>{icon}</span>
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: C.gray500 }}>{title}</p>
      </div>
      {children}
    </div>
  )
}

// CORRIGIDO: Agora recebe a propriedade "label" para exibir o nome do campo acima do input
function EditInput({ label, value, onChange, placeholder, type = 'text', className = '' }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string
}) {
  return (
    <div className="w-full flex flex-col justify-end">
      {label && <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: C.gray400 }}>{label}</p>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full text-sm font-medium px-3.5 py-2.5 rounded-xl outline-none border shadow-sm transition-all ${className}`}
        style={{ backgroundColor: C.white, borderColor: C.gray200, color: C.gray800 }}
        onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.pink50}` }}
        onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
      />
    </div>
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

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Paciente>>({})
  const [editAgendamentoForm, setEditAgendamentoForm] = useState<Partial<Agendamento>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const showToast = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'warning') => {
    setToast({ message, type, id: Date.now() })
  }

  useEffect(() => { verificarAcessoEBuscarDados() }, [])

  // ─── REALTIME: UPDATE (status), INSERT (novos agendamentos) e DELETE ───
  useEffect(() => {
    const subscription = supabase.channel('consultas_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agendamentos' },
        (payload) => {
          // Atualiza apenas o status em memória
          setAgendamentos((prevAgendamentos) =>
            prevAgendamentos.map((ag) =>
              ag.id === payload.new.id
                ? { ...ag, status: payload.new.status }
                : ag
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agendamentos' },
        () => {
          // Novo agendamento criado — recarrega a lista completa para trazer dados do paciente
          verificarAcessoEBuscarDados()
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'agendamentos' },
        (payload) => {
          // Remove o item da lista em memória
          setAgendamentos((prevAgendamentos) =>
            prevAgendamentos.filter((ag) => ag.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [])
  // ─────────────────────────────────────────────────────────────

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

  const iniciarEdicao = (ag: Agendamento) => { 
    setEditingId(ag.id)
    setEditForm(ag.paciente || {}) 
    setEditAgendamentoForm(ag)
  }
  
  const cancelarEdicao = () => { 
    setEditingId(null)
    setEditForm({}) 
    setEditAgendamentoForm({})
  }

  const salvarEdicao = async () => {
    if (!editingId) return
    setSavingEdit(true)
    try {
      if (editForm.cpf) {
        const { error: errPaciente } = await supabase.from('pacientes').update(editForm).eq('cpf', editForm.cpf)
        if (errPaciente) throw errPaciente
      }

      const { error: errAgendamento } = await supabase.from('agendamentos').update({
        data_agendamento: editAgendamentoForm.data_agendamento,
        horario_agendamento: editAgendamentoForm.horario_agendamento,
        profissional: editAgendamentoForm.profissional
      }).eq('id', editingId)
      
      if (errAgendamento) throw errAgendamento

      showToast('Dados atualizados com sucesso!', 'success')
      await verificarAcessoEBuscarDados()
      setEditingId(null)
    } catch { showToast('Erro ao atualizar os dados.', 'error') }
    finally { setSavingEdit(false) }
  }

  const alterarStatusConsulta = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id)
      if (error) throw error
      showToast(`Consulta atualizada para ${novoStatus.replace('_', ' ')}!`, 'success')
      verificarAcessoEBuscarDados()
    } catch { showToast('Erro ao alterar o status.', 'error') }
  }

  const finalizarEChamarProximo = async (idAtual: string, profissional: string) => {
    try {
      await supabase.from('agendamentos').update({ status: 'finalizado' }).eq('id', idAtual)

      const hoje = new Date().toISOString().split('T')[0]
      const { data: proximoData, error: errBusca } = await supabase
        .from('agendamentos')
        .select('id, paciente_cpf')
        .eq('status', 'aguardando')
        .eq('data_agendamento', hoje)
        .eq('profissional', profissional)
        .order('horario_agendamento', { ascending: true })
        .limit(1)

      if (errBusca) throw errBusca

      if (proximoData && proximoData.length > 0) {
        const proximoId = proximoData[0].id
        await supabase.from('agendamentos').update({ status: 'em_atendimento' }).eq('id', proximoId)
        showToast('Consulta finalizada! O próximo paciente foi chamado.', 'success')
      } else {
        showToast('Consulta finalizada. A sala de espera está vazia no momento.', 'info')
      }

      verificarAcessoEBuscarDados()
    } catch { 
      showToast('Erro ao processar a fila de espera.', 'error') 
    }
  }

  const deletarAgendamento = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar e excluir este agendamento? Esta ação não pode ser desfeita.")) return;
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
      showToast('Agendamento removido com sucesso!', 'success')
      verificarAcessoEBuscarDados()
    } catch { showToast('Erro ao excluir o agendamento.', 'error') }
  }

  const formatarData = (d?: string) => d ? d.split('-').reverse().join('/') : ''
  const formatarHora = (h?: string) => h ? h.substring(0, 5) : ''
  const formatarCPF  = (c: string) => c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''

  const toggleRow = (id: string) => {
    if (editingId) { showToast('Salve ou descarte as alterações antes de continuar.', 'warning'); return }
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

  const total          = agendamentos.length
  const naSalaDeEspera = agendamentos.filter(a => a.status === 'aguardando').length

  // ── FUNÇÃO CENTRALIZADA DE RENDERIZAÇÃO DA FICHA COMPLETA ──
  // CORRIGIDO: Todos os inputs de edição agora recebem a prop "label"
  const renderFichaPaciente = (paciente: Paciente, isEditingThis: boolean) => (
    <div className="flex flex-col gap-8">
      {/* ── DADOS BÁSICOS ── */}
      <Section icon={<User size={14} />} title="Dados básicos">
        {isEditingThis ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-12"><EditInput label="Nome completo" value={editForm.nome_completo || ''} onChange={v => setEditForm({ ...editForm, nome_completo: v })} placeholder="Nome completo" /></div>
            <div className="sm:col-span-3"><ReadField label="CPF" value={formatarCPF(paciente.cpf)} mono /></div>
            <div className="sm:col-span-3"><EditInput label="CNS" value={editForm.cns || ''} onChange={v => setEditForm({ ...editForm, cns: v })} placeholder="CNS" /></div>
            <div className="sm:col-span-3"><EditInput label="Nascimento" type="date" value={editForm.data_nascimento || ''} onChange={v => setEditForm({ ...editForm, data_nascimento: v })} /></div>
            <div className="sm:col-span-3"><EditInput label="Telefone" value={editForm.telefone || ''} onChange={v => setEditForm({ ...editForm, telefone: v })} placeholder="Telefone" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-12"><ReadField label="Nome completo" value={paciente.nome_completo} /></div>
            <div className="sm:col-span-3"><ReadField label="CPF" value={formatarCPF(paciente.cpf)} mono /></div>
            <div className="sm:col-span-3"><ReadField label="CNS" value={paciente.cns} mono /></div>
            <div className="sm:col-span-3"><ReadField label="Nascimento" value={formatarData(paciente.data_nascimento)} /></div>
            <div className="sm:col-span-3"><ReadField label="Telefone" value={paciente.telefone} icon={<Phone size={12}/>} /></div>
          </div>
        )}
      </Section>

      {/* ── FAMÍLIA E IDENTIDADE ── */}
      <Section icon={<Heart size={14} />} title="Família e Identidade">
        {isEditingThis ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6"><EditInput label="Nome da mãe" value={editForm.nome_mae || ''} onChange={v => setEditForm({ ...editForm, nome_mae: v })} placeholder="Nome da mãe" /></div>
            <div className="sm:col-span-6"><EditInput label="Nome do pai" value={editForm.nome_pai || ''} onChange={v => setEditForm({ ...editForm, nome_pai: v })} placeholder="Nome do pai" /></div>
            <div className="sm:col-span-6"><EditInput label="Nome social" value={editForm.nome_social || ''} onChange={v => setEditForm({ ...editForm, nome_social: v })} placeholder="Nome social" /></div>
            <div className="sm:col-span-6"><EditInput label="Identidade de gênero" value={editForm.identidade_genero || ''} onChange={v => setEditForm({ ...editForm, identidade_genero: v })} placeholder="Ex: Homem Trans" /></div>
            <div className="sm:col-span-6"><EditInput label="Orientação sexual" value={editForm.orientacao_sexual || ''} onChange={v => setEditForm({ ...editForm, orientacao_sexual: v })} placeholder="Ex: Heterossexual" /></div>
            <div className="sm:col-span-6"><EditInput label="Nacionalidade" value={editForm.nacionalidade || ''} onChange={v => setEditForm({ ...editForm, nacionalidade: v })} placeholder="Ex: Brasileiro" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6"><ReadField label="Nome da Mãe" value={paciente.nome_mae} /></div>
            <div className="sm:col-span-6"><ReadField label="Nome do Pai" value={paciente.nome_pai} /></div>
            <div className="sm:col-span-6"><ReadField label="Nome Social" value={paciente.nome_social} /></div>
            <div className="sm:col-span-6"><ReadField label="Identidade de Gênero" value={paciente.identidade_genero?.replace('_', ' ')} /></div>
            <div className="sm:col-span-6"><ReadField label="Orientação Sexual" value={paciente.orientacao_sexual} /></div>
            <div className="sm:col-span-6"><ReadField label="Nacionalidade" value={paciente.nacionalidade} /></div>
          </div>
        )}
      </Section>

      {/* ── ENDEREÇO PRINCIPAL ── */}
      <Section icon={<Home size={14} />} title="Endereço principal">
        {isEditingThis ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3"><EditInput label="CEP" value={editForm.cep || ''} onChange={v => setEditForm({ ...editForm, cep: v })} placeholder="CEP" /></div>
            <div className="sm:col-span-7"><EditInput label="Logradouro" value={editForm.logradouro || ''} onChange={v => setEditForm({ ...editForm, logradouro: v })} placeholder="Logradouro" /></div>
            <div className="sm:col-span-2"><EditInput label="Nº" value={editForm.numero || ''} onChange={v => setEditForm({ ...editForm, numero: v })} placeholder="Nº" /></div>
            
            <div className="sm:col-span-4"><EditInput label="Complemento" value={editForm.complemento || ''} onChange={v => setEditForm({ ...editForm, complemento: v })} placeholder="Complemento (Ex: Apto 101)" /></div>
            <div className="sm:col-span-3"><EditInput label="Bairro" value={editForm.bairro || ''} onChange={v => setEditForm({ ...editForm, bairro: v })} placeholder="Bairro" /></div>
            <div className="sm:col-span-3"><EditInput label="Cidade" value={editForm.cidade || ''} onChange={v => setEditForm({ ...editForm, cidade: v })} placeholder="Cidade" /></div>
            <div className="sm:col-span-2"><EditInput label="UF" value={editForm.uf || ''} onChange={v => setEditForm({ ...editForm, uf: v })} placeholder="UF" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3"><ReadField label="CEP" value={paciente.cep} mono /></div>
            <div className="sm:col-span-7"><ReadField label="Logradouro" value={paciente.logradouro} icon={<MapPin size={12}/>} /></div>
            <div className="sm:col-span-2"><ReadField label="Número" value={paciente.numero} /></div>
            
            <div className="sm:col-span-4"><ReadField label="Complemento" value={paciente.complemento} /></div>
            <div className="sm:col-span-3"><ReadField label="Bairro" value={paciente.bairro} /></div>
            <div className="sm:col-span-3"><ReadField label="Cidade" value={paciente.cidade} /></div>
            <div className="sm:col-span-2"><ReadField label="UF" value={paciente.uf} /></div>
          </div>
        )}
      </Section>
    </div>
  )

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: C.pink100, borderTopColor: C.pink400 }} />
      <p className="text-sm font-medium" style={{ color: C.gray400 }}>Carregando consultas…</p>
    </div>
  )

  return (
    <section className="animate-fade-in relative space-y-6">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-3 fade-in duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-sm font-bold max-w-md backdrop-blur-md ${
            toast.type === 'error'   ? 'bg-white/95 border-red-200 text-red-800' :
            toast.type === 'success' ? 'bg-white/95 border-green-200 text-green-800' :
            toast.type === 'info'    ? 'bg-white/95 border-sky-200 text-sky-800' :
            'bg-white/95 border-amber-200 text-amber-800'
          }`}>
            {toast.type === 'error'   && <XCircle       size={18} className="shrink-0 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle size={18} className="shrink-0 text-amber-500" />}
            {toast.type === 'success' && <CheckCircle2  size={18} className="shrink-0 text-green-500" />}
            {toast.type === 'info'    && <Info          size={18} className="shrink-0 text-sky-500" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          HEADER E INDICADORES
      ════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl tracking-tight" style={{ color: C.gray800 }}>
            Painel de Consultas
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: C.gray500 }}>
            Gerencie os agendamentos e acompanhe a Fila de Espera.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm"
            style={{ background: C.white, color: C.gray700, borderColor: C.gray200 }}>
            <CalendarDays size={14} style={{ color: C.gray400 }}/> {total} Registros
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm"
            style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FEF3C7' }}>
            <Clock size={14} /> {naSalaDeEspera} Na Sala de Espera
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          FILTROS
      ════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
          <input
            type="text" placeholder="Buscar paciente por nome ou CPF…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-3 text-sm font-medium rounded-xl border outline-none shadow-sm transition-all bg-white"
            style={{ borderColor: C.gray200 }}
            onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.pink50}` }}
            onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
          />
        </div>
        <div className="relative sm:w-60">
          <Stethoscope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
          <select value={profissionalFilter} onChange={e => setProfissionalFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-3 text-sm font-medium rounded-xl border outline-none shadow-sm transition-all appearance-none cursor-pointer bg-white"
            style={{ borderColor: C.gray200, color: C.gray700 }}
            onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.pink50}` }}
            onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
            <option value="todos">Todos os municípios</option>
            {LISTA_PROFISSIONAIS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <Filter size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray300 }} />
        </div>
        <div className="relative sm:w-48">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="w-full pl-4 pr-8 py-3 text-sm font-medium rounded-xl border outline-none shadow-sm transition-all appearance-none cursor-pointer bg-white"
            style={{ borderColor: C.gray200, color: C.gray700 }}
            onFocus={e => { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.boxShadow = `0 0 0 4px ${C.pink50}` }}
            onBlur={e  => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
            <option value="todos">Todos os status</option>
            <option value="agendado">Agendados</option>
            <option value="aguardando">Na Sala de Espera</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="finalizado">Finalizados</option>
          </select>
        </div>
      </div>

      {/* ════════════════════════════════════════
          LISTA DE AGENDAMENTOS — Desktop
      ════════════════════════════════════════ */}
      <div className="hidden md:block">
        {agendamentosFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl border p-20 text-center shadow-sm" style={{ borderColor: C.gray200 }}>
            <FileText size={40} className="mx-auto mb-4 opacity-20" style={{ color: C.gray500 }} />
            <p className="text-base font-bold" style={{ color: C.gray600 }}>Nenhuma consulta encontrada.</p>
            <p className="text-sm mt-1" style={{ color: C.gray400 }}>Tente ajustar os filtros ou buscar por outro nome.</p>
          </div>
        ) : (
          <div className="rounded-2xl border shadow-sm bg-white overflow-hidden" style={{ borderColor: C.gray200 }}>

            <div className="grid grid-cols-[2fr_1.4fr_1.8fr_1fr_auto] gap-0 px-0"
              style={{ background: C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
              {['Paciente', 'Data e hora', 'Profissional', 'Status', ''].map((h, i) => (
                <div key={i} className={`px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-widest ${i === 4 ? 'pr-5' : ''}`}
                  style={{ color: C.gray500 }}>
                  {h}
                </div>
              ))}
            </div>

            <div className="divide-y" style={{ borderColor: C.gray100 }}>
              {agendamentosFiltrados.map(ag => {
                const isExpanded    = expandedRow === ag.id
                const paciente      = ag.paciente
                const isEditingThis = editingId === ag.id
                const nome = paciente?.nome_completo || 'Paciente Não Identificado'
                const cpf  = ag.paciente_cpf ? formatarCPF(ag.paciente_cpf) : 'Sem CPF'

                return (
                  <Fragment key={ag.id}>

                    <div
                      className="grid grid-cols-[2fr_1.4fr_1.8fr_1fr_auto] items-center cursor-pointer transition-colors"
                      style={{ background: isExpanded ? C.pink50 : C.white }}
                      onClick={() => toggleRow(ag.id)}
                      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = C.gray50 }}
                      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = C.white }}
                    >
                      <div className="px-5 py-4 flex items-center gap-3.5">
                        <Avatar nome={nome} />
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: C.gray800 }}>{nome}</p>
                          <p className="text-[11px] font-mono mt-0.5 tracking-tight" style={{ color: C.gray400 }}>{cpf}</p>
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} style={{ color: C.pink400 }} />
                          <span className="text-sm font-bold" style={{ color: C.gray700 }}>
                            {formatarData(ag.data_agendamento)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={13} style={{ color: C.gray400 }} />
                          <span className="text-xs font-medium" style={{ color: C.gray500 }}>
                            {formatarHora(ag.horario_agendamento)}
                          </span>
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <span className="text-sm font-medium" style={{ color: ag.profissional ? C.gray700 : C.gray300 }}>
                          {ag.profissional ?? <em>Não atribuído</em>}
                        </span>
                      </div>

                      <div className="px-5 py-4">
                        <StatusBadge status={ag.status} />
                      </div>

                      <div className="px-5 py-4">
                        <button
                          onClick={e => { e.stopPropagation(); toggleRow(ag.id) }}
                          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl whitespace-nowrap transition-all"
                          style={{
                            color: isExpanded ? C.pink600 : C.gray600,
                            background: isExpanded ? C.white : C.gray50,
                            border: `1px solid ${isExpanded ? C.pink100 : C.gray200}`
                          }}
                          onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.background = C.gray100 }}>
                          {isExpanded ? <><ChevronUp size={14} /> Fechar</> : <><ChevronDown size={14} /> Ficha</>}
                        </button>
                      </div>
                    </div>

                    {/* ══════════════════════════════════════════
                        PAINEL EXPANDIDO DESKTOP
                    ══════════════════════════════════════════ */}
                    {isExpanded && paciente && (
                      <div className="flex animate-in slide-in-from-top-2 fade-in duration-200"
                        style={{ borderTop: `1px solid ${C.gray200}` }}>

                        <div className="flex-1 bg-white">
                          
                          <div className="flex items-center justify-between px-7 py-5" style={{ background: C.pink50, borderBottom: `1px solid ${C.pink100}` }}>
                            <div className="flex items-center gap-3">
                              <Avatar nome={nome} size="lg" />
                              <div>
                                <p className="font-extrabold text-lg leading-tight" style={{ color: C.gray800 }}>
                                  {isEditingThis ? editForm.nome_completo || nome : nome}
                                </p>
                                <p className="text-xs font-mono mt-0.5 tracking-tight" style={{ color: C.pink600 }}>{cpf}</p>
                              </div>
                            </div>

                            {!isEditingThis ? (
                              <button onClick={() => iniciarEdicao(ag)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm bg-white"
                                style={{ color: C.pink700, border: `1px solid ${C.pink200}` }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = C.pink400}
                                onMouseLeave={e => e.currentTarget.style.borderColor = C.pink200}>
                                <Edit3 size={13} /> Atualizar dados
                              </button>
                            ) : (
                              <span className="text-[10px] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider border shadow-sm"
                                style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FEF3C7' }}>
                                Modo de edição
                              </span>
                            )}
                          </div>

                          <div className="px-7 py-6">
                            {renderFichaPaciente(paciente, isEditingThis)}

                            {isEditingThis && (
                              <div className="flex items-center justify-end gap-3 mt-8 pt-5"
                                style={{ borderTop: `1px dashed ${C.gray200}` }}>
                                <button onClick={cancelarEdicao}
                                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all shadow-sm"
                                  style={{ background: C.white, borderColor: C.gray200, color: C.gray600 }}
                                  onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                                  onMouseLeave={e => e.currentTarget.style.background = C.white}>
                                  <X size={14} /> Descartar
                                </button>
                                <button onClick={salvarEdicao} disabled={savingEdit}
                                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white transition-all shadow-sm disabled:opacity-50"
                                  style={{ background: C.pink600 }}
                                  onMouseEnter={e => { if (!savingEdit) { e.currentTarget.style.background = C.pink700; e.currentTarget.style.boxShadow = `0 4px 12px ${C.pink200}` } }}
                                  onMouseLeave={e => { e.currentTarget.style.background = C.pink600; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                                  {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                  Salvar alterações
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── PAINEL DIREITO (AÇÕES / AGENDAMENTO) ── */}
                        <div className="w-72 shrink-0 px-6 py-6 flex flex-col gap-6"
                          style={{ background: C.gray50, borderLeft: `1px solid ${C.gray200}` }}>

                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: C.gray400 }}>
                              Dados do Agendamento
                            </p>
                            
                            {isEditingThis ? (
                              <div className="rounded-xl p-4 space-y-4 shadow-sm border bg-white" style={{ borderColor: C.gray200 }}>
                                {/* CORRIGIDO: Utilizando o EditInput com a propriedade "label" */}
                                <EditInput label="Data" type="date" value={editAgendamentoForm.data_agendamento || ''} onChange={v => setEditAgendamentoForm({ ...editAgendamentoForm, data_agendamento: v })} />
                                <EditInput label="Horário" type="time" value={editAgendamentoForm.horario_agendamento || ''} onChange={v => setEditAgendamentoForm({ ...editAgendamentoForm, horario_agendamento: v })} />
                              </div>
                            ) : (
                              <div className="rounded-xl p-4 space-y-3 shadow-sm border bg-white" style={{ borderColor: C.gray200 }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: C.gray50, borderColor: C.gray100 }}>
                                    <CalendarDays size={14} style={{ color: C.gray600 }} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.gray400 }}>Data</p>
                                    <p className="text-sm font-extrabold mt-0.5" style={{ color: C.gray800 }}>
                                      {formatarData(ag.data_agendamento)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: C.gray50, borderColor: C.gray100 }}>
                                    <Clock size={14} style={{ color: C.gray600 }} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.gray400 }}>Horário</p>
                                    <p className="text-sm font-extrabold mt-0.5" style={{ color: C.gray800 }}>
                                      {formatarHora(ag.horario_agendamento)}
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t" style={{ borderColor: C.gray100 }}>
                                  <StatusBadge status={ag.status} />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: C.gray400 }}>
                              Profissional / Local
                            </p>
                            <div className="relative shadow-sm">
                              <Stethoscope size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.pink400 }} />
                              <select
                                disabled={!isEditingThis}
                                value={isEditingThis ? (editAgendamentoForm.profissional || '') : (ag.profissional || '')}
                                onChange={e => setEditAgendamentoForm({ ...editAgendamentoForm, profissional: e.target.value })}
                                className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border outline-none appearance-none font-bold bg-white disabled:opacity-70 disabled:bg-gray-50"
                                style={{ borderColor: C.gray200, color: C.gray800 }}>
                                <option value="" disabled>Selecionar…</option>
                                {LISTA_PROFISSIONAIS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* ── AÇÕES DESKTOP ── */}
                          {!isEditingThis && (
                            <div className="mt-auto space-y-2">
                              
                              {ag.status === 'aguardando' && (
                                <button onClick={() => alterarStatusConsulta(ag.id, 'em_atendimento')}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-extrabold rounded-xl text-white shadow-md transition-all hover:-translate-y-0.5"
                                  style={{ background: C.pink600 }}>
                                  <CheckCircle2 size={16} /> Iniciar Atendimento
                                </button>
                              )}

                              {ag.status === 'em_atendimento' && (
                                <div className="space-y-2">
                                  <button onClick={() => finalizarEChamarProximo(ag.id, ag.profissional || '')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-extrabold rounded-xl text-white shadow-md transition-all hover:-translate-y-0.5"
                                    style={{ background: '#2563EB' }}> 
                                    <User size={16} /> Finalizar e Chamar Próximo
                                  </button>

                                  <button onClick={() => alterarStatusConsulta(ag.id, 'finalizado')}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl border shadow-sm transition-all"
                                    style={{ color: '#166534', borderColor: '#D1FAE5', background: '#ECFDF5' }}>
                                    Apenas Finalizar
                                  </button>
                                </div>
                              )}

                              {ag.status !== 'finalizado' && (
                                <button onClick={() => deletarAgendamento(ag.id)}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl border shadow-sm transition-all bg-white mt-4"
                                  style={{ color: '#DC2626', borderColor: C.gray200 }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F2'; e.currentTarget.style.borderColor = '#FECDD3' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.gray200 }}>
                                  <XCircle size={15} /> Cancelar consulta
                                </button>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          CARDS — Mobile (Responsivo ajustado)
      ════════════════════════════════════════ */}
      <div className="md:hidden space-y-4">
        {agendamentosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm" style={{ borderColor: C.gray200 }}>
            <FileText size={32} className="mx-auto mb-3 opacity-20" style={{ color: C.gray500 }} />
            <p className="text-sm font-bold" style={{ color: C.gray600 }}>Nenhum agendamento encontrado.</p>
          </div>
        ) : agendamentosFiltrados.map(ag => {
          const isExpanded    = expandedRow === ag.id
          const paciente      = ag.paciente
          const isEditingThis = editingId === ag.id
          const nome = paciente?.nome_completo || 'Paciente Não Identificado'
          const cpf  = ag.paciente_cpf ? formatarCPF(ag.paciente_cpf) : 'Sem CPF'

          return (
            <div key={ag.id} className="bg-white rounded-2xl border overflow-hidden shadow-sm transition-all"
              style={{ borderColor: isExpanded ? C.pink300 : C.gray200 }}>

              <button className="w-full flex items-center gap-3.5 p-4 text-left transition-colors"
                style={{ background: isExpanded ? C.pink50 : C.white }}
                onClick={() => toggleRow(ag.id)}>
                <Avatar nome={nome} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: C.gray800 }}>{nome}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: C.gray500 }}>
                      {formatarData(ag.data_agendamento)} · {formatarHora(ag.horario_agendamento)}
                    </span>
                    <StatusBadge status={ag.status} />
                  </div>
                </div>
                <div style={{ color: isExpanded ? C.pink600 : C.gray400 }}>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {isExpanded && paciente && (
                <div className="px-4 pb-5 pt-2 animate-in slide-in-from-top-2 fade-in duration-200"
                  style={{ borderTop: `1px solid ${C.pink100}` }}>

                  <div className="flex items-center justify-between mb-6 mt-2">
                    <div>
                       <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: C.gray400 }}>
                        Ficha do paciente
                      </p>
                      <p className="text-sm font-mono tracking-tight mt-0.5" style={{ color: C.gray600 }}>{cpf}</p>
                    </div>
                    
                    {!isEditingThis && (
                      <button onClick={() => iniciarEdicao(ag)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border shadow-sm"
                        style={{ color: C.pink700, background: C.pink50, borderColor: C.pink100 }}>
                        <Edit3 size={12} /> Editar
                      </button>
                    )}
                  </div>

                  <div className="mb-8">
                     {renderFichaPaciente(paciente, isEditingThis)}
                  </div>

                  {isEditingThis && (
                    <div className="p-4 rounded-xl border mb-4 space-y-4 bg-white" style={{ borderColor: C.gray200 }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                        Dados do Agendamento
                      </p>
                      {/* CORRIGIDO: Utilizando o EditInput com a propriedade "label" no mobile */}
                      <EditInput label="Data" type="date" value={editAgendamentoForm.data_agendamento || ''} onChange={v => setEditAgendamentoForm({ ...editAgendamentoForm, data_agendamento: v })} />
                      <EditInput label="Horário" type="time" value={editAgendamentoForm.horario_agendamento || ''} onChange={v => setEditAgendamentoForm({ ...editAgendamentoForm, horario_agendamento: v })} />
                    </div>
                  )}

                  <div className="p-4 rounded-xl border mb-4" style={{ background: isEditingThis ? C.white : C.gray50, borderColor: C.gray200 }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: C.gray400 }}>
                      Profissional responsável
                    </p>
                    <div className="relative shadow-sm">
                      <Stethoscope size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.gray400 }} />
                      <select 
                        disabled={!isEditingThis}
                        value={isEditingThis ? (editAgendamentoForm.profissional || '') : (ag.profissional || '')}
                        onChange={e => setEditAgendamentoForm({ ...editAgendamentoForm, profissional: e.target.value })}
                        className="w-full pl-9 pr-3 py-3 text-sm rounded-xl border outline-none appearance-none font-bold bg-white disabled:opacity-70 disabled:bg-gray-50"
                        style={{ borderColor: C.gray200, color: C.gray800 }}>
                        <option value="" disabled>Selecionar…</option>
                        {LISTA_PROFISSIONAIS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* ── AÇÕES MOBILE ── */}
                  {!isEditingThis && (
                    <div className="space-y-2.5 mt-2">
                      
                      {ag.status === 'aguardando' && (
                        <button onClick={() => alterarStatusConsulta(ag.id, 'em_atendimento')}
                          className="w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold rounded-xl text-white shadow-md"
                          style={{ background: C.pink600 }}>
                          <CheckCircle2 size={16} /> Iniciar Atendimento
                        </button>
                      )}

                      {ag.status === 'em_atendimento' && (
                        <>
                          <button onClick={() => finalizarEChamarProximo(ag.id, ag.profissional || '')}
                            className="w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-extrabold rounded-xl text-white shadow-md"
                            style={{ background: '#2563EB' }}>
                            <User size={16} /> Finalizar e Chamar Próximo
                          </button>
                          <button onClick={() => alterarStatusConsulta(ag.id, 'finalizado')}
                            className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl border shadow-sm"
                            style={{ color: '#166534', borderColor: '#D1FAE5', background: '#ECFDF5' }}>
                            Apenas Finalizar
                          </button>
                        </>
                      )}
                      
                      {ag.status !== 'finalizado' && (
                        <button onClick={() => deletarAgendamento(ag.id)}
                          className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl border shadow-sm bg-white"
                          style={{ color: '#DC2626', borderColor: C.gray200 }}>
                          <XCircle size={15} /> Cancelar consulta
                        </button>
                      )}
                    </div>
                  )}

                  {isEditingThis && (
                    <div className="flex gap-3 pt-4 mt-4 border-t" style={{ borderColor: C.gray200 }}>
                      <button onClick={cancelarEdicao}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 text-xs font-bold rounded-xl border shadow-sm bg-white"
                        style={{ borderColor: C.gray200, color: C.gray600 }}>
                        <X size={14} /> Descartar
                      </button>
                      <button onClick={salvarEdicao} disabled={savingEdit}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 text-xs font-bold rounded-xl text-white shadow-md disabled:opacity-50"
                        style={{ background: C.pink600 }}>
                        {savingEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar dados
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </section>
  )
}
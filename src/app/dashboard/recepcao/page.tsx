'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Search, CheckCircle2, Clock, CalendarDays,
  UserX, AlertTriangle, XCircle, Info, Stethoscope, User, ChevronDown
} from 'lucide-react'

// ── Tipagens ────────────────────────────────────────────────────
type Paciente = {
  cpf: string
  nome_completo: string
  telefone: string
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
  pink50:  '#FDF2F8', pink100: '#FCE7F3', pink200: '#F9D0E9',
  pink300: '#F5A6D5', pink400: '#E84393', pink500: '#D63D8A',
  pink600: '#C2185B', pink700: '#AD1457',
  gray50:  '#FAFAFA', gray100: '#F4F4F5', gray200: '#E4E4E7',
  gray300: '#D1D5DB', gray400: '#A1A1AA', gray500: '#71717A',
  gray600: '#52525B', gray700: '#3F3F46', gray800: '#18181B',
  white:   '#FFFFFF',
}

export default function RecepcaoPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [profissionalFilter, setProfissionalFilter] = useState('todos')
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, id: Date.now() })
  }

  // Limpa o toast após 3 segundos
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Busca dados e escuta o Realtime (Atualização Automática)
  useEffect(() => { 
    buscarDadosFila() 
    
    const subscription = supabase.channel('recepcao_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
        buscarDadosFila()
      })
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [])

  const buscarDadosFila = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0] // Garante que foca na fila de hoje
      
      const { data: agendamentosData, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data_agendamento', hoje) // Puxa a fila do dia
        .neq('status', 'finalizado')  // Oculta os já finalizados
        .order('horario_agendamento', { ascending: true })

      if (error) throw error
      if (!agendamentosData) { setAgendamentos([]); return }

      const cpfs = [...new Set(agendamentosData.map((a: any) => a.paciente_cpf).filter(Boolean))]
      
      const { data: pacientesData } = await supabase
        .from('pacientes')
        .select('cpf, nome_completo, telefone')
        .in('cpf', cpfs)

      setAgendamentos(agendamentosData.map((ag: any) => ({
        ...ag,
        paciente: pacientesData?.find((p: Paciente) => p.cpf === ag.paciente_cpf),
      })))
    } catch (error) {
      showToast('Erro ao carregar a fila.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // AÇÃO PRINCIPAL DA RECEPÇÃO: Check-in
  const fazerCheckIn = async (id: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ status: 'aguardando' }).eq('id', id)
      if (error) throw error
      
      showToast('Check-in realizado! Paciente enviado para o médico.', 'success')
      buscarDadosFila()
    } catch {
      showToast('Erro ao fazer check-in.', 'error')
    }
  }

  // AÇÃO SECUNDÁRIA: Registrar falta
  const registrarFalta = async (id: string) => {
    if (!window.confirm("Confirmar que o paciente faltou? A consulta será cancelada.")) return
    try {
      const { error } = await supabase.from('agendamentos').update({ status: 'finalizado' }).eq('id', id)
      if (error) throw error
      
      showToast('Falta registrada e horário liberado.', 'info')
      buscarDadosFila()
    } catch {
      showToast('Erro ao registrar falta.', 'error')
    }
  }

  const formatarCPF = (c: string) => c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : ''

  // APLICA OS DOIS FILTROS: Busca (Nome/CPF) e Profissional
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const matchBusca = (ag.paciente?.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (ag.paciente_cpf || '').includes(searchTerm);
    
    const matchProfissional = profissionalFilter === 'todos' || ag.profissional === profissionalFilter;

    return matchBusca && matchProfissional;
  })

  // Os contadores agora usam os dados filtrados para refletirem a realidade do que está na tela!
  const filaEspera = agendamentosFiltrados.filter(a => a.status === 'aguardando').length
  const agendadosRestantes = agendamentosFiltrados.filter(a => a.status === 'agendado').length

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.pink100, borderTopColor: C.pink400 }} />
      <p className="text-sm font-medium text-gray-400">Carregando recepção…</p>
    </div>
  )

  return (
    <section className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      
      {/* ── Toasts ── */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-3">
          <div className={`px-5 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-sm font-bold max-w-md ${
            toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            'bg-sky-50 text-sky-800 border-sky-200'
          }`}>
            {toast.type === 'error' && <XCircle size={18} className="text-red-500" />}
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-500" />}
            {toast.type === 'info' && <Info size={18} className="text-sky-500" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-2xl" style={{ color: C.gray800 }}>Recepção & Check-in</h1>
          <p className="text-sm font-medium mt-1" style={{ color: C.gray500 }}>
            Confirme a chegada dos pacientes para enviá-los ao médico.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white rounded-xl border flex items-center gap-2 text-xs font-bold text-gray-600 shadow-sm">
            <CalendarDays size={14} className="text-gray-400"/> {agendadosRestantes} A Caminho
          </div>
          <div className="px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-sm"
               style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FEF3C7' }}>
            <Clock size={14} /> {filaEspera} Aguardando
          </div>
        </div>
      </div>

      {/* ── Filtros (Busca e Profissional) ── */}
      <div className="flex flex-col sm:flex-row gap-4 w-full bg-white p-4 rounded-2xl border shadow-sm" style={{ borderColor: C.gray200 }}>
        
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar paciente por nome ou CPF..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm font-medium focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all bg-gray-50"
          />
        </div>

        {/* Dropdown Profissional */}
        <div className="relative sm:w-72">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-600">
            <Stethoscope size={16} />
          </div>
          <select
            value={profissionalFilter}
            onChange={e => setProfissionalFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border outline-none text-sm font-bold text-gray-700 appearance-none cursor-pointer focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all"
            style={{ borderColor: profissionalFilter !== 'todos' ? C.pink400 : C.gray200, backgroundColor: profissionalFilter !== 'todos' ? C.pink50 : '#F9FAFB' }}
          >
            <option value="todos">Todos os Profissionais</option>
            {LISTA_PROFISSIONAIS.map(p => (
              <option key={p} value={p}>Dr(a). {p}</option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>

      </div>

      {/* ── Lista de Pacientes ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {agendamentosFiltrados.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <CalendarDays size={32} className="mb-3 text-gray-300" />
            {agendamentos.length > 0 
              ? "Nenhum paciente encontrado para este filtro."
              : "Nenhum paciente pendente para a recepção de hoje."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agendamentosFiltrados.map(ag => {
              const paciente = ag.paciente
              const isAgendado = ag.status === 'agendado'

              return (
                <div key={ag.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  
                  {/* Info do Paciente */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-pink-50 text-pink-600 border border-pink-100 shrink-0">
                      {paciente?.nome_completo ? paciente.nome_completo.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{paciente?.nome_completo || 'Sem Nome'}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-gray-500">
                        <span className="font-mono">{ag.paciente_cpf ? formatarCPF(ag.paciente_cpf) : 'S/ CPF'}</span>
                        <span className="flex items-center gap-1"><Clock size={11}/> {(ag.horario_agendamento || '').substring(0,5)}</span>
                        <span className="flex items-center gap-1 text-pink-600 font-semibold"><Stethoscope size={11}/> {ag.profissional || 'Não definido'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges ou Ações */}
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {isAgendado ? (
                      <>
                        <button onClick={() => registrarFalta(ag.id)}
                          className="px-3 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-1.5">
                          <UserX size={14} /> Faltou
                        </button>
                        <button onClick={() => fazerCheckIn(ag.id)}
                          className="px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
                          <CheckCircle2 size={16} /> Fazer Check-in
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border w-full justify-center sm:justify-start"
                        style={{
                          background: ag.status === 'aguardando' ? '#FFFBEB' : '#EFF6FF',
                          color: ag.status === 'aguardando' ? '#D97706' : '#2563EB',
                          borderColor: ag.status === 'aguardando' ? '#FEF3C7' : '#DBEAFE'
                        }}>
                        {ag.status === 'aguardando' ? <><Clock size={14}/> Na Sala de Espera</> : <><User size={14}/> Em Atendimento</>}
                      </div>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

    </section>
  )
}
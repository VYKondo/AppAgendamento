'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' 
import {
  Clock, Save, CheckCircle2, ChevronLeft, ChevronRight,
  CalendarDays, Stethoscope, Loader2, AlertCircle, Trash2,
  Sun, Sunrise, Sunset, Moon, Info, User, X, Sparkles, Check,
  Settings2, Calendar
} from 'lucide-react'

// ─── Constantes ───────────────────────────────────────────────────────────────
const LISTA_PROFISSIONAIS = [
  'Gleiciane (Município A)',
  'Carlos (Município B)',
  'Adriana (Município C)',
]

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  pink50:  '#FFF0F6', pink100: '#FFD6E7', pink200: '#FFADD2', pink300: '#FAA2C1',
  pink400: '#F06595', pink600: '#E64980', pink800: '#A61E4D',
  gray50:  '#F8F9FA', gray100: '#F1F3F5', gray200: '#E9ECEF', gray300: '#DEE2E6',
  gray400: '#ADB5BD', gray500: '#868E96', gray600: '#6C757D', gray700: '#495057', gray800: '#212529',
  green50: '#EBFBEE', green600: '#2F9E44', green800: '#1C7431',
  amber50: '#FFF9DB', amber600: '#E67700',
  white:   '#FFFFFF',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Slot = { hora: string; ativo: boolean }
type DiaAgenda = { 
  ativo: boolean; 
  tipo_escala: 'semanal' | 'intercalada'; 
  data_base_intercalada: string; 
  slots: Slot[] 
}
type Agenda = Record<string, DiaAgenda> 

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const DIAS_ABREV  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const BLOCOS_HORARIO = [
  { 
    label: 'Manhã',   
    icon: Sunrise, 
    horas: ['07:30', '07:50', '08:10', '08:30', '08:50', '09:10', '09:30', '09:50', '10:10', '10:30', '10:50', '11:10', '11:30'] 
  },
  { 
    label: 'Tarde',   
    icon: Sun,     
    horas: ['13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40', '16:00', '16:20', '16:40', '17:00'] 
  },
]

const TODAS_HORAS = BLOCOS_HORARIO.flatMap(b => b.horas)

function buildAgendaVazia(): Agenda {
  const agenda: Agenda = {}
  for (let i = 0; i < 7; i++) {
    agenda[i.toString()] = { 
      ativo: false, 
      tipo_escala: 'semanal', 
      data_base_intercalada: '', 
      slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) 
    }
  }
  return agenda
}

function LoadingScreen() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
      <Loader2 size={32} className="animate-spin text-pink-600" />
      <span className="text-sm font-medium text-gray-500">Preparando calendário…</span>
    </div>
  )
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const bg    = type === 'success' ? C.green50  : '#FFF0F0'
  const color = type === 'success' ? C.green800 : '#C92A2A'
  const Icon  = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ background: bg, color, borderColor: type === 'success' ? '#B2F2BB' : '#FFC9C9' }}>
      <Icon size={18} /><span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgendaMedicaPage() {
  const router = useRouter()
  
  const [authStatus, setAuthStatus]     = useState<'loading' | 'auth'>('loading')
  const [agenda, setAgenda]             = useState<Agenda>(buildAgendaVazia())
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  
  const [diaSelecionado, setDiaSelecionado] = useState<number>(1) 
  const [viewMode, setViewMode] = useState<'semana' | 'dia'>('dia')
  const [hasChanges, setHasChanges]     = useState(false)

  // ─── NOVO: Estado para selecionar o profissional ───
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string>('')

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        router.push('/dashboard')
        return
      }
      setAuthStatus('auth')
    }
    checkAuth()
  }, [router])

  // Carrega a escala sempre que mudar o profissional selecionado
  useEffect(() => {
    if (!profissionalSelecionado) {
      setAgenda(buildAgendaVazia())
      setHasChanges(false)
      return
    }

    async function load() {
      // CORREÇÃO: Busca por "profissional" e não "medico_id"
      const { data, error } = await supabase
        .from('escalas_medicas')
        .select('*')
        .eq('profissional', profissionalSelecionado)
      
      if (error) {
        console.error("Erro ao buscar:", error)
        return
      }

      const nova = buildAgendaVazia()
      
      if (data && data.length > 0) {
        data.forEach(d => {
          const key = d.dia_semana.toString()
          if (nova[key]) {
            nova[key].ativo = true
            nova[key].tipo_escala = d.tipo_escala || 'semanal'
            nova[key].data_base_intercalada = d.data_base_intercalada || ''
            
            d.horarios.forEach((h: string) => {
              const slot = nova[key].slots.find(s => s.hora === h)
              if (slot) slot.ativo = true
            })
          }
        })
      }
      setAgenda(nova)
      setHasChanges(false)
    }
    load()
  }, [profissionalSelecionado])

  const updateDiaConfig = useCallback((diaKey: string, field: keyof DiaAgenda, value: any) => {
    setAgenda(prev => ({ ...prev, [diaKey]: { ...prev[diaKey], [field]: value } }))
    setHasChanges(true)
  }, [])

  const toggleSlot = useCallback((diaKey: string, hora: string) => {
    setAgenda(prev => {
      const dia = prev[diaKey]
      return {
        ...prev,
        [diaKey]: {
          ...dia,
          ativo: true,
          slots: dia.slots.map(s => s.hora === hora ? { ...s, ativo: !s.ativo } : s)
        }
      }
    })
    setHasChanges(true)
  }, [])

  const toggleBloco = useCallback((diaKey: string, horas: string[], ativar: boolean) => {
    setAgenda(prev => {
      const dia = prev[diaKey]
      return {
        ...prev,
        [diaKey]: {
          ...dia,
          ativo: ativar ? true : dia.ativo,
          slots: dia.slots.map(s => horas.includes(s.hora) ? { ...s, ativo: ativar } : s)
        }
      }
    })
    setHasChanges(true)
  }, [])

  const limparDia = useCallback((diaKey: string) => {
    setAgenda(prev => ({
      ...prev,
      [diaKey]: { ...prev[diaKey], ativo: false, slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) }
    }))
    setHasChanges(true)
  }, [])

  // ─── SALVAR NO BANCO ───
  async function salvarAgenda() {
    if (!profissionalSelecionado) {
      setToast({ msg: 'Selecione um profissional primeiro!', type: 'error' })
      return
    }

    setSaving(true)
    try {
      // CORREÇÃO: Limpa as regras baseadas no nome do profissional
      await supabase.from('escalas_medicas').delete().eq('profissional', profissionalSelecionado)

      const insertData = Object.entries(agenda)
        .filter(([_, dia]) => dia.ativo && dia.slots.some(s => s.ativo))
        .map(([key, dia]) => ({
          profissional: profissionalSelecionado, // CORREÇÃO AQUI
          dia_semana: parseInt(key),
          tipo_escala: dia.tipo_escala,
          data_base_intercalada: dia.tipo_escala === 'intercalada' && dia.data_base_intercalada ? dia.data_base_intercalada : null,
          horarios: dia.slots.filter(s => s.ativo).map(s => s.hora).sort()
        }))

      if (insertData.length > 0) {
        const { error } = await supabase.from('escalas_medicas').insert(insertData)
        if (error) throw error
      }

      setToast({ msg: 'Padrão de horários salvo com sucesso!', type: 'success' })
      setHasChanges(false)
    } catch (error) {
      console.error("Erro completo do Supabase:", error) // Adicionado log para facilitar debug futuro
      setToast({ msg: 'Erro ao salvar a escala. Tente novamente.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function getSlotsAtivos(diaKey: string): number {
    return agenda[diaKey]?.slots.filter(s => s.ativo).length ?? 0
  }

  function isSlotAtivo(diaKey: string, hora: string): boolean {
    return agenda[diaKey]?.slots.find(s => s.hora === hora)?.ativo ?? false
  }

  function isBlocoTodoParcial(diaKey: string, horas: string[]): 'nenhum' | 'parcial' | 'todos' {
    const ativos = horas.filter(h => isSlotAtivo(diaKey, h)).length
    if (ativos === 0) return 'nenhum'
    if (ativos === horas.length) return 'todos'
    return 'parcial'
  }

  function totalSlotsSemana(): number {
    return Object.values(agenda).reduce((acc, d) => acc + d.slots.filter(s => s.ativo).length, 0)
  }

  if (authStatus === 'loading') return <LoadingScreen />

  const diaAtualKey = diaSelecionado.toString()
  const diaAgendaAtual = agenda[diaAtualKey]

  return (
    <div className="animate-fade-in w-full pb-20">

      {/* ── Barra de Controles Mestre ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* SELETOR DE PROFISSIONAL (Adicionado para amarrar a lógica) */}
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="p-2 bg-pink-50 rounded-lg"><Stethoscope size={18} className="text-pink-600"/></div>
           <select
             value={profissionalSelecionado}
             onChange={e => setProfissionalSelecionado(e.target.value)}
             className="flex-1 md:w-64 py-2 px-3 border rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-pink-400"
             style={{ borderColor: C.gray200 }}
           >
             <option value="" disabled>Selecione o Profissional...</option>
             {LISTA_PROFISSIONAIS.map(p => (
               <option key={p} value={p}>Dr(a). {p}</option>
             ))}
           </select>
        </div>

        {/* Botão Salvar Global */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg animate-pulse font-bold" style={{ background: C.amber50, color: C.amber600 }}>
              <Info size={14} /> Alterações não salvas
            </span>
          )}
          <button
            onClick={salvarAgenda}
            disabled={saving || !hasChanges || !profissionalSelecionado}
            className="flex items-center w-full md:w-auto justify-center gap-2 px-6 py-2 h-10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: (hasChanges && profissionalSelecionado) && !saving ? C.pink600 : C.gray300, cursor: (hasChanges && profissionalSelecionado) && !saving ? 'pointer' : 'not-allowed' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando…' : 'Salvar Calendário'}
          </button>
        </div>
      </div>

      {/* ── SEÇÃO OPACA SE NENHUM PROFISSIONAL FOR SELECIONADO ── */}
      <div className={`transition-opacity duration-300 ${!profissionalSelecionado ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        
        {/* ── Page title + stats ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={20} style={{ color: C.pink600 }} />
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: C.gray800 }}>
                Padrão de Atendimento
              </h2>
            </div>
            <p className="text-sm font-medium" style={{ color: C.gray500 }}>
              Gerencie as regras fixas dos dias e horários da sua agenda.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 rounded-xl border text-center shadow-sm" style={{ background: C.pink50, borderColor: C.pink100 }}>
              <p className="text-xl font-extrabold leading-none" style={{ color: C.pink600 }}>{totalSlotsSemana()}</p>
              <p className="text-xs mt-1 font-bold" style={{ color: C.pink800 }}>Vagas por semana</p>
            </div>
            {/* O toggle de Visão Semanal / Diária foi removido daqui */}
          </div>
        </div>

        {/* ── Day selector strip ── */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {[0, 1, 2, 3, 4, 5, 6].map((diaNum) => {
            const key      = diaNum.toString()
            const ativos   = getSlotsAtivos(key)
            const isSel    = diaSelecionado === diaNum
            const isActiveDay = agenda[key]?.ativo

            return (
              <button
                key={key}
                onClick={() => { setDiaSelecionado(diaNum); setViewMode('dia') }}
                className="flex flex-col items-center min-w-[80px] px-3 py-3 rounded-2xl border transition-all duration-150 shrink-0"
                style={{
                  borderColor: isSel ? C.pink400 : isActiveDay ? C.pink200 : C.gray200,
                  background:  isSel ? C.pink600 : isActiveDay ? C.pink50  : C.white,
                  boxShadow:   isSel ? `0 4px 16px ${C.pink200}` : 'none',
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isSel ? 'rgba(255,255,255,0.75)' : C.gray400 }}>
                  {DIAS_ABREV[diaNum]}
                </span>
                <span className="text-sm font-extrabold" style={{ color: isSel ? C.white : isActiveDay ? C.pink600 : C.gray800 }}>
                  {DIAS_SEMANA[diaNum].split('-')[0]}
                </span>
                {ativos > 0 ? (
                  <span
                    className="mt-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                    style={{
                      background: isSel ? 'rgba(255,255,255,0.25)' : C.pink100,
                      color:      isSel ? C.white : C.pink800,
                    }}
                  >
                    {ativos} vagas
                  </span>
                ) : (
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: isSel ? 'rgba(255,255,255,0.3)' : C.gray200 }} />
                )}
              </button>
            )
          })}
        </div>

        {/* ══════════ VIEW: DIA ══════════ */}
        {viewMode === 'dia' && diaAgendaAtual && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Blocos de horário ── */}
            <div className="lg:col-span-2 space-y-5">
              
              <div className="bg-white rounded-2xl border p-5 shadow-sm" style={{ borderColor: C.gray100 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={diaAgendaAtual.ativo} 
                      onChange={e => updateDiaConfig(diaAtualKey, 'ativo', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <span className={`font-bold text-base ${diaAgendaAtual.ativo ? 'text-gray-800' : 'text-gray-400'}`}>
                      Ativar Atendimentos na {DIAS_SEMANA[diaSelecionado]}
                    </span>
                  </label>

                  {diaAgendaAtual.ativo && (
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} className="text-gray-400" />
                      <select
                        value={diaAgendaAtual.tipo_escala}
                        onChange={e => updateDiaConfig(diaAtualKey, 'tipo_escala', e.target.value)}
                        className="px-3 py-2 text-sm font-semibold rounded-lg border outline-none bg-white text-gray-700 shadow-sm"
                        style={{ borderColor: C.gray200 }}
                      >
                        <option value="semanal">Toda Semana</option>
                        <option value="intercalada">Semana Sim / Semana Não</option>
                      </select>
                    </div>
                  )}
                </div>

                {diaAgendaAtual.ativo && diaAgendaAtual.tipo_escala === 'intercalada' && (
                  <div className="mt-4 flex flex-col gap-1.5 p-4 rounded-xl border bg-amber-50 border-amber-200 animate-in fade-in">
                    <label className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <Calendar size={14}/> Data de Referência (Uma {DIAS_SEMANA[diaSelecionado]} em que você atende):
                    </label>
                    <input 
                      type="date" 
                      value={diaAgendaAtual.data_base_intercalada}
                      onChange={e => updateDiaConfig(diaAtualKey, 'data_base_intercalada', e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border outline-none w-full sm:w-48 bg-white border-amber-200 focus:border-amber-400"
                    />
                    <p className="text-[11px] text-amber-700 mt-1">
                      Isso ajuda o sistema a saber quando é sua semana de folga e quando é semana de trabalho.
                    </p>
                  </div>
                )}
              </div>

              <div className={`space-y-5 transition-opacity duration-300 ${!diaAgendaAtual.ativo ? 'opacity-40 pointer-events-none' : ''}`}>
                {BLOCOS_HORARIO.map(bloco => {
                  const estado = isBlocoTodoParcial(diaAtualKey, bloco.horas)
                  return (
                    <div key={bloco.label} className="bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md" style={{ borderColor: C.gray100 }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                            <bloco.icon size={16} style={{ color: C.pink600 }} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold" style={{ color: C.gray800 }}>{bloco.label}</h3>
                            <p className="text-xs" style={{ color: C.gray400 }}>{bloco.horas[0]} – {bloco.horas.at(-1)}</p>
                          </div>
                          {estado === 'parcial' && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: C.amber50, color: C.amber600 }}>Parcial</span>}
                          {estado === 'todos' && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: C.green50, color: C.green600 }}><Sparkles size={10} /> Completo</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleBloco(diaAtualKey, bloco.horas, true)} className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all" style={{ background: C.pink50, color: C.pink600 }}>Selecionar Todos</button>
                          <button onClick={() => toggleBloco(diaAtualKey, bloco.horas, false)} className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all" style={{ background: C.gray100, color: C.gray600 }}>Limpar</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {bloco.horas.map(hora => {
                          const ativo = isSlotAtivo(diaAtualKey, hora)
                          return (
                            <button
                              key={hora}
                              onClick={() => toggleSlot(diaAtualKey, hora)}
                              className="py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all duration-150"
                              style={{
                                borderColor: ativo ? C.pink600 : C.gray200,
                                background:  ativo ? C.pink600 : C.white,
                                color:       ativo ? C.white   : C.gray600,
                                boxShadow:   ativo ? `0 0 0 3px ${C.pink100}` : 'none',
                              }}
                            >
                              <Clock size={12} style={{ opacity: ativo ? 1 : 0.5 }} />
                              {hora}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Sidebar resumo do dia ── */}
            <aside className="space-y-4">
              <div className="bg-white rounded-2xl border p-5 sticky top-24 shadow-sm" style={{ borderColor: C.gray100 }}>
                <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: C.gray100 }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                      <CalendarDays size={14} style={{ color: C.pink600 }} />
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: C.gray800 }}>
                      {DIAS_SEMANA[diaSelecionado]}
                    </h3>
                  </div>
                  <button onClick={() => limparDia(diaAtualKey)} className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50" title="Limpar dia inteiro">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Slots preenchidos', value: getSlotsAtivos(diaAtualKey), color: C.pink600, bg: C.pink50 },
                    { label: 'Horas totais', value: `${(getSlotsAtivos(diaAtualKey) * (20 / 60)).toFixed(1)}h`, color: C.green600, bg: C.green50 },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                      <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {getSlotsAtivos(diaAtualKey) > 0 ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gray400 }}>Vagas Habilitadas</p>
                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                      {agenda[diaAtualKey]?.slots.filter(s => s.ativo).map(s => (
                        <span key={s.hora} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold" style={{ background: C.pink50, color: C.pink800 }}>
                          <Clock size={10} /> {s.hora}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 rounded-xl border-2 border-dashed text-center" style={{ borderColor: C.gray200 }}>
                    <CalendarDays size={24} className="mb-2" style={{ color: C.gray200 }} />
                    <p className="text-xs font-medium" style={{ color: C.gray400 }}>Nenhum horário marcado</p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.gray400 }}>Clique nos slots para abrir vagas</p>
                  </div>
                )}

                {/* Ação rápida */}
                <button
                  onClick={() => {
                    BLOCOS_HORARIO.forEach(b => {
                      if (b.label === 'Manhã' || b.label === 'Tarde') toggleBloco(diaAtualKey, b.horas, true)
                    })
                  }}
                  className="w-full mt-4 py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all"
                  style={{ borderColor: C.pink200, color: C.pink600, background: C.pink50 }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.pink100 }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.pink50 }}
                >
                  <Sparkles size={14} /> Preencher manhãs e tardes
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ── Toast notification ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
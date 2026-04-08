'use client'

import { useEffect, useState, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' 
import {
  Clock, Save, CheckCircle2, ChevronLeft, ChevronRight,
  CalendarDays, Stethoscope, Loader2, AlertCircle, Trash2,
  Sun, Sunrise, Sunset, Moon, Info, User, X, Sparkles, Check,
} from 'lucide-react'

// ─── Design tokens (Corrigidos e Completos) ──────────────────────────────────
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
type DiaAgenda = { slots: Slot[] }
type Agenda = Record<string, DiaAgenda>

// ─── Constants ────────────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DIAS_ABREV  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const BLOCOS_HORARIO = [
  { label: 'Manhã',   icon: Sunrise, horas: ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'] },
  { label: 'Tarde',   icon: Sun,     horas: ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'] },
  { label: 'Noite',   icon: Sunset,  horas: ['18:00','18:30','19:00','19:30','20:00','20:30'] },
  { label: 'Madrugada', icon: Moon,  horas: ['21:00','21:30','22:00'] },
]

const TODAS_HORAS = BLOCOS_HORARIO.flatMap(b => b.horas)

function diaSemanaKey(date: Date): string {
  return `${date.getFullYear()}-W${getWeekNumber(date)}-${date.getDay()}`
}

function getWeekNumber(d: Date): number {
  const date = new Date(d)
  date.setHours(0,0,0,0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

function getWeekDates(offset = 0): Date[] {
  const hoje = new Date()
  const dow = hoje.getDay()
  const monday = new Date(hoje)
  monday.setDate(hoje.getDate() - dow + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i - 1)
    return d
  })
}

function formatDateBR(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function buildAgendaVazia(): Agenda {
  const agenda: Agenda = {}
  const dias = getWeekDates(0)
  dias.forEach(d => {
    const key = diaSemanaKey(d)
    agenda[key] = { slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) }
  })
  return agenda
}

/* // ─── Loading screen simplificado ──────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
      <Loader2 size={32} className="animate-spin text-pink-600" />
      <span className="text-sm font-medium text-gray-500">Verificando credenciais…</span>
    </div>
  )
} */

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const bg    = type === 'success' ? C.green50  : '#FFF0F0'
  const color = type === 'success' ? C.green800 : '#C92A2A'
  const Icon  = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ background: bg, color, borderColor: type === 'success' ? '#B2F2BB' : '#FFC9C9' }}
    >
      <Icon size={18} />
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgendaMedicaPage() {
  const router = useRouter()
  //const [authStatus, setAuthStatus]     = useState<'loading' | 'auth'>('loading')
  const [medico, setMedico]             = useState<any>(null)
  const [weekOffset, setWeekOffset]     = useState(0)
  const [diasSemana, setDiasSemana]     = useState<Date[]>([])
  const [agenda, setAgenda]             = useState<Agenda>(buildAgendaVazia())
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [diaSelecionado, setDiaSelecionado] = useState<number>(1) // 1 = segunda
  const [viewMode, setViewMode]         = useState<'semana' | 'dia'>('semana')
  const [hasChanges, setHasChanges]     = useState(false)

/*   // ── Auth check ──
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) { 
        setMedico(data.session.user)
        setAuthStatus('auth') 
      } else {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])
 */
  // ── Week dates ──
  useEffect(() => {
    setDiasSemana(getWeekDates(weekOffset))
  }, [weekOffset])

  // ── Load agenda from Supabase ──
  useEffect(() => {
    if (!medico || diasSemana.length === 0) return
    async function load() {
      const inicioSemana = diasSemana[1]?.toISOString().split('T')[0]
      const { data } = await supabase
        .from('agenda_medico')
        .select('*')
        .eq('medico_id', medico.id)
        .eq('semana_inicio', inicioSemana)
        .single()
      
      if (data?.slots) {
        setAgenda(data.slots as Agenda)
      } else {
        const nova = buildAgendaVazia()
        setAgenda(nova)
      }
      setHasChanges(false)
    }
    load()
  }, [medico, diasSemana])

  // ── Toggle slot ──
  const toggleSlot = useCallback((diaKey: string, hora: string) => {
    setAgenda(prev => {
      const dia = prev[diaKey] ?? { slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) }
      return {
        ...prev,
        [diaKey]: {
          slots: dia.slots.map(s => s.hora === hora ? { ...s, ativo: !s.ativo } : s)
        }
      }
    })
    setHasChanges(true)
  }, [])

  // ── Toggle bloco inteiro ──
  const toggleBloco = useCallback((diaKey: string, horas: string[], ativar: boolean) => {
    setAgenda(prev => {
      const dia = prev[diaKey] ?? { slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) }
      return {
        ...prev,
        [diaKey]: {
          slots: dia.slots.map(s => horas.includes(s.hora) ? { ...s, ativo: ativar } : s)
        }
      }
    })
    setHasChanges(true)
  }, [])

  // ── Limpar dia ──
  const limparDia = useCallback((diaKey: string) => {
    setAgenda(prev => ({
      ...prev,
      [diaKey]: { slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) }
    }))
    setHasChanges(true)
  }, [])

  // ── Save ──
  async function salvarAgenda() {
    if (!medico || diasSemana.length === 0) return
    setSaving(true)
    try {
      const inicioSemana = diasSemana[1]?.toISOString().split('T')[0]
      const { error } = await supabase.from('agenda_medico').upsert({
        medico_id:     medico.id,
        semana_inicio: inicioSemana,
        slots:         agenda,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'medico_id,semana_inicio' })
      if (error) throw error
      setToast({ msg: 'Agenda salva com sucesso!', type: 'success' })
      setHasChanges(false)
    } catch {
      setToast({ msg: 'Erro ao salvar. Tente novamente.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // ── Helpers ──
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

  // ─────────────────────────────────────────────────────────────────────────────

  //if (authStatus === 'loading') return <LoadingScreen />

  const diaAtual = diasSemana[diaSelecionado]
  const diaAtualKey = diaAtual ? diaSemanaKey(diaAtual) : ''
  const hojeStr = new Date().toDateString()

  return (
    <div className="animate-fade-in w-full pb-20">

      {/* ── Barra de Controles Mestre ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Navegação de Semanas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 text-gray-500"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-2 h-10 rounded-xl border text-sm font-semibold transition-all"
            style={{
              borderColor: weekOffset === 0 ? C.pink400 : C.gray200,
              background:  weekOffset === 0 ? C.pink50  : C.white,
              color:       weekOffset === 0 ? C.pink600 : C.gray600,
            }}
          >
            Semana atual
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 text-gray-500"
          >
            <ChevronRight size={18} />
          </button>
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
            disabled={saving || !hasChanges}
            className="flex items-center w-full md:w-auto justify-center gap-2 px-6 py-2 h-10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: hasChanges && !saving ? C.pink600 : C.gray300, cursor: hasChanges && !saving ? 'pointer' : 'not-allowed' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando…' : 'Salvar Calendário'}
          </button>
        </div>
      </div>

      {/* ── Page title + stats ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={20} style={{ color: C.pink600 }} />
            <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: C.gray800 }}>
              {diasSemana[1] && diasSemana[6]
                ? `${formatDateBR(diasSemana[1])} até ${formatDateBR(diasSemana[6])}`
                : 'Carregando…'}
            </h2>
          </div>
          <p className="text-sm font-medium" style={{ color: C.gray500 }}>
            Gerencie os slots em que você estará disponível para consultas.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 rounded-xl border text-center shadow-sm" style={{ background: C.pink50, borderColor: C.pink100 }}>
            <p className="text-xl font-extrabold leading-none" style={{ color: C.pink600 }}>{totalSlotsSemana()}</p>
            <p className="text-xs mt-1 font-bold" style={{ color: C.pink800 }}>Vagas na semana</p>
          </div>
          
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border shadow-sm" style={{ borderColor: C.gray200 }}>
            {(['semana', 'dia'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className="px-4 py-2.5 text-xs font-bold transition-all capitalize"
                style={{
                  background: viewMode === v ? C.pink600 : C.white,
                  color:      viewMode === v ? C.white   : C.gray600,
                }}
              >
                {v === 'semana' ? '📅 Visão Semanal' : '📋 Visão Diária'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Day selector strip ── */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {diasSemana.map((d, i) => {
          const key      = diaSemanaKey(d)
          const ativos   = getSlotsAtivos(key)
          const isHoje   = d.toDateString() === hojeStr
          const isSel    = diaSelecionado === i
          const isPast   = d < new Date(new Date().setHours(0,0,0,0))
          return (
            <button
              key={i}
              onClick={() => { setDiaSelecionado(i); setViewMode('dia') }}
              className="flex flex-col items-center min-w-[72px] px-3 py-3 rounded-2xl border transition-all duration-150 shrink-0"
              style={{
                borderColor: isSel ? C.pink400 : isHoje ? C.pink200 : C.gray200,
                background:  isSel ? C.pink600 : isHoje ? C.pink50  : C.white,
                opacity:     isPast && !isHoje ? 0.55 : 1,
                boxShadow:   isSel ? `0 4px 16px ${C.pink200}` : 'none',
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: isSel ? 'rgba(255,255,255,0.75)' : C.gray400 }}>
                {DIAS_ABREV[d.getDay()]}
              </span>
              <span className="text-lg font-extrabold leading-none" style={{ color: isSel ? C.white : isHoje ? C.pink600 : C.gray800 }}>
                {d.getDate()}
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

      {/* ══════════ VIEW: SEMANA ══════════ */}
      {viewMode === 'semana' && (
        <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ borderColor: C.gray200, background: C.white }}>
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr style={{ background: C.gray50, borderBottom: `1px solid ${C.gray100}` }}>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider w-24" style={{ color: C.gray400 }}>Horário</th>
                {diasSemana.map((d, i) => {
                  const isHoje = d.toDateString() === hojeStr
                  return (
                    <th key={i} className="px-2 py-3 text-xs font-bold text-center" style={{ color: isHoje ? C.pink600 : C.gray600 }}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="uppercase tracking-wider text-[10px]" style={{ color: isHoje ? C.pink400 : C.gray400 }}>{DIAS_ABREV[d.getDay()]}</span>
                        <span
                          className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-extrabold"
                          style={{ background: isHoje ? C.pink600 : 'transparent', color: isHoje ? C.white : C.gray800 }}
                        >
                          {d.getDate()}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {TODAS_HORAS.map((hora, hi) => {
                const bloco = BLOCOS_HORARIO.find(b => b.horas[0] === hora)
                return (
                  <Fragment key={hora}>
                    {bloco && (
                      <tr style={{ background: C.gray50 }}>
                        <td colSpan={8} className="px-4 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <bloco.icon size={11} style={{ color: C.pink400 }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.gray400 }}>{bloco.label}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr
                      style={{ borderBottom: `1px solid ${C.gray100}` }}
                      className="hover:bg-pink-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-2 text-xs font-mono font-semibold" style={{ color: C.gray400 }}>{hora}</td>
                      {diasSemana.map((d, di) => {
                        const key   = diaSemanaKey(d)
                        const ativo = isSlotAtivo(key, hora)
                        const isPast = d < new Date(new Date().setHours(0,0,0,0))
                        return (
                          <td key={di} className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => !isPast && toggleSlot(key, hora)}
                              disabled={isPast}
                              className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all duration-100 shadow-sm border"
                              style={{
                                borderColor: ativo ? C.pink600 : C.gray200,
                                background: ativo ? C.pink600 : C.gray50,
                                cursor:     isPast ? 'not-allowed' : 'pointer',
                                opacity:    isPast ? 0.4 : 1,
                              }}
                              onMouseEnter={e => { if (!isPast && !ativo) { e.currentTarget.style.background = C.pink50; e.currentTarget.style.borderColor = C.pink300 } }}
                              onMouseLeave={e => { if (!ativo) { e.currentTarget.style.background = C.gray50; e.currentTarget.style.borderColor = C.gray200 } }}
                            >
                              {ativo && <Check size={14} strokeWidth={3} className="text-white" />}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════ VIEW: DIA ══════════ */}
      {viewMode === 'dia' && diaAtual && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Blocos de horário ── */}
          <div className="lg:col-span-2 space-y-5">
            {BLOCOS_HORARIO.map(bloco => {
              const estado = isBlocoTodoParcial(diaAtualKey, bloco.horas)
              return (
                <div
                  key={bloco.label}
                  className="bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md"
                  style={{ borderColor: C.gray100 }}
                >
                  {/* Bloco header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                        <bloco.icon size={16} style={{ color: C.pink600 }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: C.gray800 }}>{bloco.label}</h3>
                        <p className="text-xs" style={{ color: C.gray400 }}>{bloco.horas[0]} – {bloco.horas.at(-1)}</p>
                      </div>
                      {estado === 'parcial' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: C.amber50, color: C.amber600 }}>Parcial</span>
                      )}
                      {estado === 'todos' && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: C.green50, color: C.green600 }}>
                          <Sparkles size={10} /> Completo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleBloco(diaAtualKey, bloco.horas, true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: C.pink50, color: C.pink600 }}
                        onMouseEnter={e => e.currentTarget.style.background = C.pink100}
                        onMouseLeave={e => e.currentTarget.style.background = C.pink50}
                      >
                        Selecionar Todos
                      </button>
                      <button
                        onClick={() => toggleBloco(diaAtualKey, bloco.horas, false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: C.gray100, color: C.gray600 }}
                        onMouseEnter={e => e.currentTarget.style.background = C.gray200}
                        onMouseLeave={e => e.currentTarget.style.background = C.gray100}
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  {/* Slots grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {bloco.horas.map(hora => {
                      const ativo = isSlotAtivo(diaAtualKey, hora)
                      const isPast = diaAtual < new Date(new Date().setHours(0,0,0,0))
                      return (
                        <button
                          key={hora}
                          onClick={() => !isPast && toggleSlot(diaAtualKey, hora)}
                          disabled={isPast}
                          className="py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all duration-150"
                          style={{
                            borderColor: ativo ? C.pink600 : C.gray200,
                            background:  ativo ? C.pink600 : C.white,
                            color:       ativo ? C.white   : isPast ? C.gray300 : C.gray600,
                            opacity:     isPast ? 0.5 : 1,
                            cursor:      isPast ? 'not-allowed' : 'pointer',
                            boxShadow:   ativo ? `0 0 0 3px ${C.pink100}` : 'none',
                          }}
                          onMouseEnter={e => { if (!ativo && !isPast) { e.currentTarget.style.borderColor = C.pink400; e.currentTarget.style.background = C.pink50; e.currentTarget.style.color = C.pink600 } }}
                          onMouseLeave={e => { if (!ativo) { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.background = C.white; e.currentTarget.style.color = isPast ? C.gray300 : C.gray600 } }}
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

          {/* ── Sidebar resumo do dia ── */}
          <aside className="space-y-4">
            {/* Resumo card */}
            <div
              className="bg-white rounded-2xl border p-5 sticky top-24 shadow-sm"
              style={{ borderColor: C.gray100 }}
            >
              <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: C.gray100 }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
                    <User size={14} style={{ color: C.pink600 }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: C.gray800 }}>
                    {DIAS_SEMANA[diaAtual.getDay()]}, {formatDateBR(diaAtual)}
                  </h3>
                </div>
                <button
                  onClick={() => limparDia(diaAtualKey)}
                  className="p-1.5 rounded-lg transition-colors"
                  title="Limpar dia inteiro"
                  style={{ color: C.gray400 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C92A2A'; e.currentTarget.style.background = '#FFF0F0' }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.gray400; e.currentTarget.style.background = 'transparent' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Slots livres', value: getSlotsAtivos(diaAtualKey), color: C.pink600, bg: C.pink50 },
                  { label: 'Horas totais', value: `${(getSlotsAtivos(diaAtualKey) * 0.5).toFixed(1)}h`, color: C.green600, bg: C.green50 },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                    <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Lista dos slots ativos */}
              {getSlotsAtivos(diaAtualKey) > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.gray400 }}>Vagas Habilitadas</p>
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {agenda[diaAtualKey]?.slots
                      .filter(s => s.ativo)
                      .map(s => (
                        <span
                          key={s.hora}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: C.pink50, color: C.pink800 }}
                        >
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

      {/* ── Toast notification ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Clock, Save, CheckCircle2, ChevronLeft, ChevronRight,
  CalendarDays, Stethoscope, Loader2, AlertCircle, Trash2,
  Sun, Sunrise, Info, X, Sparkles, UserX, MapPin, Users,
} from 'lucide-react'
import { C } from '@/styles/palette'

const green50 = '#EBFBEE', green600 = '#2F9E44', green800 = '#1C7431'
const amber50 = '#FFF9DB', amber600 = '#E67700'

// ─── Types ────────────────────────────────────────────────────────────────────
type Slot      = { hora: string; ativo: boolean }
type DiaAgenda = { slots: Slot[] }
type Agenda    = Record<string, DiaAgenda> // chave: 'YYYY-MM-DD'

type ProfissionalInfo = {
  nomeCompleto: string    // "Adriana (Município C)" - valor para DB
  nome: string            // "Adriana"
  municipio: string       // "Município C"
  iniciais: string        // "AD"
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const BLOCOS_HORARIO = [
  {
    label: 'Manhã', icon: Sunrise,
    horas: ['07:30','07:50','08:10','08:30','08:50','09:10','09:30','09:50',
            '10:10','10:30','10:50','11:10','11:30'],
  },
  {
    label: 'Tarde', icon: Sun,
    horas: ['13:00','13:20','13:40','14:00','14:20','14:40','15:00','15:20',
            '15:40','16:00','16:20','16:40','17:00'],
  },
]
const TODAS_HORAS = BLOCOS_HORARIO.flatMap(b => b.horas)
const DIAS_ABREV  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DIAS_SEMANA = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const MESES_LABEL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_ABREV = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

// ─── Helpers de data ──────────────────────────────────────────────────────────
function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
function todayKey(): string {
  const t = new Date()
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate())
}
function isBeforeToday(key: string): boolean { return key < todayKey() }
function labelFromKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DIAS_SEMANA[date.getDay()]}, ${d} de ${MESES_ABREV[m - 1]}. de ${y}`
}
function buildDiaVazio(): DiaAgenda {
  return { slots: TODAS_HORAS.map(h => ({ hora: h, ativo: false })) }
}

// ─── Helpers de profissional ──────────────────────────────────────────────────
function parseProfissional(nomeCompleto: string): ProfissionalInfo {
  const match = nomeCompleto.match(/^(.+?)\s*\((.+?)\)$/)
  if (match) {
    const nome = match[1].trim()
    const municipio = match[2].trim()
    const iniciais = nome.split(' ')
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('')
    return { nomeCompleto, nome, municipio, iniciais }
  }
  const iniciais = nomeCompleto.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
  return { nomeCompleto, nome: nomeCompleto, municipio: '', iniciais: iniciais || 'PR' }
}

function gerarCorPorNome(nome: string): string {
  // Gera uma cor consistente baseada no nome para o avatar
  const cores = [C.pink400, '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return cores[Math.abs(hash) % cores.length]
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
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
  const bg    = type === 'success' ? green50  : '#FFF0F0'
  const color = type === 'success' ? green800 : '#C92A2A'
  const Icon  = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ background: bg, color, borderColor: type === 'success' ? '#B2F2BB' : '#FFC9C9' }}
    >
      <Icon size={18} /><span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
    </div>
  )
}

// ─── Avatar do Profissional ───────────────────────────────────────────────────
function AvatarProfissional({ info, size = 'md' }: { info: ProfissionalInfo; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const bg = gerarCorPorNome(info.nome)
  
  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: bg }}
      title={info.nomeCompleto}
    >
      {info.iniciais}
    </div>
  )
}

// ─── Opção do Dropdown de Profissionais ───────────────────────────────────────
function ProfissionalOption({ info, selected }: { info: ProfissionalInfo; selected: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <AvatarProfissional info={info} size="sm" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-pink-700' : 'text-gray-800'}`}>
          {info.nome}
        </p>
        {info.municipio && (
          <p className={`text-xs truncate flex items-center gap-1 ${selected ? 'text-pink-500' : 'text-gray-400'}`}>
            <MapPin size={10} />
            {info.municipio}
          </p>
        )}
      </div>
      {selected && <CheckCircle2 size={16} className="text-pink-600 shrink-0" />}
    </div>
  )
}

// ─── SlotEditor ───────────────────────────────────────────────────────────────
function SlotEditor({
  dateKey: dk,
  onToggleSlot,
  onToggleBloco,
  onLimpar,
  isSlotAtivo,
  isBlocoEstado,
  getSlotsAtivos,
}: {
  dateKey: string
  onToggleSlot:   (key: string, hora: string) => void
  onToggleBloco:  (key: string, horas: string[], ativar: boolean) => void
  onLimpar:       (key: string) => void
  isSlotAtivo:    (key: string, hora: string) => boolean
  isBlocoEstado:  (key: string, horas: string[]) => 'nenhum' | 'parcial' | 'todos'
  getSlotsAtivos: (key: string) => number
}) {
  const ativos = getSlotsAtivos(dk)

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: C.gray100 }}>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.gray100, background: C.pink50 }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.pink400 }}>Horários do dia</p>
          <h3 className="text-sm font-extrabold mt-0.5 leading-snug" style={{ color: C.gray800 }}>
            {labelFromKey(dk)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {ativos > 0 && (
            <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: C.pink100, color: C.pink800 }}>
              {ativos} vagas
            </span>
          )}
          <button
            onClick={() => onLimpar(dk)}
            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50"
            title="Limpar dia"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Blocos de horário */}
      <div className="p-5 space-y-5">
        {BLOCOS_HORARIO.map(bloco => {
          const estado = isBlocoEstado(dk, bloco.horas)
          return (
            <div key={bloco.label}>
              {/* Header do bloco */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: C.pink50 }}>
                    <bloco.icon size={13} style={{ color: C.pink600 }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: C.gray700 }}>{bloco.label}</span>
                  <span className="text-[10px]" style={{ color: C.gray400 }}>
                    {bloco.horas[0]} – {bloco.horas.at(-1)}
                  </span>
                  {estado === 'parcial' && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: amber50, color: amber600 }}>Parcial</span>
                  )}
                  {estado === 'todos' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: green50, color: green600 }}>
                      <Sparkles size={8} /> Completo
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onToggleBloco(dk, bloco.horas, true)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: C.pink50, color: C.pink600 }}
                  >Todos</button>
                  <button
                    onClick={() => onToggleBloco(dk, bloco.horas, false)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: C.gray100, color: C.gray600 }}
                  >Limpar</button>
                </div>
              </div>

              {/* Grid de slots */}
              <div className="grid grid-cols-4 gap-1.5">
                {bloco.horas.map(hora => {
                  const ativo = isSlotAtivo(dk, hora)
                  return (
                    <button
                      key={hora}
                      onClick={() => onToggleSlot(dk, hora)}
                      className="py-2 rounded-xl border text-[11px] font-bold transition-all duration-150"
                      style={{
                        borderColor: ativo ? C.pink600 : C.gray200,
                        background:  ativo ? C.pink600 : C.white,
                        color:       ativo ? '#fff'    : C.gray600,
                        boxShadow:   ativo ? `0 0 0 2px ${C.pink100}` : 'none',
                      }}
                    >
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
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AgendaMedicaPage() {
  const router = useRouter()
  const hoje   = new Date()

  const [authStatus,              setAuthStatus]              = useState<'loading' | 'auth'>('loading')
  const [agenda,                  setAgenda]                  = useState<Agenda>({})
  const [saving,                  setSaving]                  = useState(false)
  const [toast,                   setToast]                   = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [hasChanges,              setHasChanges]              = useState(false)
  const [calYear,                 setCalYear]                 = useState(hoje.getFullYear())
  const [calMonth,                setCalMonth]                = useState(hoje.getMonth())
  const [dataSelecionada,         setDataSelecionada]         = useState<string | null>(null)
  
  // Lista completa de profissionais com informações parseadas
  const [profissionaisInfo,       setProfissionaisInfo]       = useState<ProfissionalInfo[]>([])
  const [carregandoProfissionais, setCarregandoProfissionais] = useState(true)
  
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('')
  const [datasOriginais,          setDatasOriginais]          = useState<Set<string>>(new Set())

  // Memoiza a lista de profissionais parseados para performance
  const profissionaisParseados = useMemo(() => {
    return profissionaisInfo.map(parseProfissional)
  }, [profissionaisInfo])

  // ── Auth + carregar todos os profissionais ─────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) { router.push('/dashboard'); return }
      setAuthStatus('auth')

      // Carrega TODOS os profissionais únicos da tabela escalas_medicas
      setCarregandoProfissionais(true)
      try {
        const { data: rows, error } = await supabase
          .from('escalas_medicas')
          .select('profissional')
          .order('profissional')

        if (error) throw error

        // Deduplica mantendo a ordem
        const nomesUnicos = [...new Set(rows?.map(r => r.profissional as string) || [])]
        setProfissionaisInfo(nomesUnicos)
      } catch (err) {
        console.error('Erro ao carregar profissionais:', err)
        setToast({ msg: 'Erro ao carregar quadro médico.', type: 'error' })
      } finally {
        setCarregandoProfissionais(false)
      }
    }
    checkAuth()
  }, [router])

  // ── Carrega agenda ao trocar profissional ─────────────────────────────────
  useEffect(() => {
    if (!profissionalSelecionado) {
      setAgenda({})
      setHasChanges(false)
      setDatasOriginais(new Set())
      return
    }
    async function load() {
      const { data, error } = await supabase
        .from('escalas_medicas')
        .select('data, horarios')
        .eq('profissional', profissionalSelecionado)

      if (error) { console.error(error); return }

      const nova: Agenda = {}
      const datas = new Set<string>()

      data?.forEach(row => {
        const key = row.data as string
        nova[key] = {
          slots: TODAS_HORAS.map(h => ({ hora: h, ativo: (row.horarios as string[]).includes(h) }))
        }
        datas.add(key)
      })

      setAgenda(nova)
      setDatasOriginais(datas)
      setHasChanges(false)
    }
    load()
  }, [profissionalSelecionado])

  // ── Helpers de leitura ────────────────────────────────────────────────────
  const getSlotsAtivos = (key: string) =>
    agenda[key]?.slots.filter(s => s.ativo).length ?? 0

  const isSlotAtivo = useCallback((key: string, hora: string) =>
    agenda[key]?.slots.find(s => s.hora === hora)?.ativo ?? false,
  [agenda])

  const isBlocoEstado = useCallback((key: string, horas: string[]): 'nenhum' | 'parcial' | 'todos' => {
    const ativos = horas.filter(h => isSlotAtivo(key, h)).length
    if (ativos === 0)            return 'nenhum'
    if (ativos === horas.length) return 'todos'
    return 'parcial'
  }, [isSlotAtivo])

  // ── Mutações de agenda ────────────────────────────────────────────────────
  const toggleSlot = useCallback((key: string, hora: string) => {
    setAgenda(prev => {
      const dia = prev[key] ?? buildDiaVazio()
      return { ...prev, [key]: { slots: dia.slots.map(s => s.hora === hora ? { ...s, ativo: !s.ativo } : s) } }
    })
    setHasChanges(true)
  }, [])

  const toggleBloco = useCallback((key: string, horas: string[], ativar: boolean) => {
    setAgenda(prev => {
      const dia = prev[key] ?? buildDiaVazio()
      return { ...prev, [key]: { slots: dia.slots.map(s => horas.includes(s.hora) ? { ...s, ativo: ativar } : s) } }
    })
    setHasChanges(true)
  }, [])

  const limparDia = useCallback((key: string) => {
    setAgenda(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setHasChanges(true)
  }, [])

  // ── Salvar ────────────────────────────────────────────────────────────────
  async function salvarAgenda() {
    if (!profissionalSelecionado) {
      setToast({ msg: 'Selecione um profissional primeiro!', type: 'error' })
      return
    }
    setSaving(true)
    try {
      // 1. Rows with at least one active slot → upsert
      const upsertRows = Object.entries(agenda)
        .filter(([, dia]) => dia.slots.some(s => s.ativo))
        .map(([key, dia]) => ({
          profissional: profissionalSelecionado,
          data:         key,
          horarios:     dia.slots.filter(s => s.ativo).map(s => s.hora).sort(),
        }))

      if (upsertRows.length > 0) {
        const { error } = await supabase
          .from('escalas_medicas')
          .upsert(upsertRows, { onConflict: 'profissional,data' })
        if (error) throw error
      }

      // 2. Dates that existed in DB but are now empty/removed → delete individually
      const datasAtivas = new Set(upsertRows.map(r => r.data))
      const datasParaDeletar = [...datasOriginais].filter(d => !datasAtivas.has(d))

      if (datasParaDeletar.length > 0) {
        const { error } = await supabase
          .from('escalas_medicas')
          .delete()
          .eq('profissional', profissionalSelecionado)
          .in('data', datasParaDeletar)
        if (error) throw error
      }

      // 3. Update local reference set
      setDatasOriginais(datasAtivas)
      setToast({ msg: 'Agenda salva com sucesso!', type: 'success' })
      setHasChanges(false)
    } catch (err) {
      console.error(err)
      setToast({ msg: 'Erro ao salvar. Tente novamente.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // ── Calendário ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const cellsDayMonth = (() => {
    const firstDow  = new Date(calYear, calMonth, 1).getDay()
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDow; i++) cells.push(null)
    for (let d = 1; d <= totalDays; d++) cells.push(d)
    return cells
  })()

  const totalVagasMes = cellsDayMonth.reduce((acc, d) => {
    if (!d) return acc
    return acc + getSlotsAtivos(dateKey(calYear, calMonth, d))
  }, 0)

  const totalVagasGeral = Object.values(agenda)
    .reduce((acc, dia) => acc + dia.slots.filter(s => s.ativo).length, 0)

  // Profissional selecionado parseado para exibição
  const profissionalAtual = useMemo(() => {
    if (!profissionalSelecionado) return null
    return parseProfissional(profissionalSelecionado)
  }, [profissionalSelecionado])

  if (authStatus === 'loading') return <LoadingScreen />

  return (
    <div className="animate-fade-in w-full pb-20">

      {/* ── Barra superior ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-pink-50 rounded-lg"><Users size={18} className="text-pink-600" /></div>
          
          {carregandoProfissionais ? (
            <div className="flex-1 md:w-64 py-2 px-3 border rounded-xl text-sm text-gray-400 flex items-center gap-2" style={{ borderColor: C.gray200 }}>
              <Loader2 size={14} className="animate-spin" />
              Carregando profissionais...
            </div>
          ) : (
            <select
              value={profissionalSelecionado}
              onChange={e => { setProfissionalSelecionado(e.target.value); setDataSelecionada(null) }}
              className="flex-1 md:w-64 py-2 px-3 border rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-pink-400 bg-white"
              style={{ borderColor: C.gray200 }}
            >
              <option value="" disabled>Selecione o Profissional...</option>
              {profissionaisParseados.map(info => (
                <option key={info.nomeCompleto} value={info.nomeCompleto}>
                  {info.nome}{info.municipio ? ` — ${info.municipio}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg animate-pulse font-bold" style={{ background: amber50, color: amber600 }}>
              <Info size={14} /> Alterações não salvas
            </span>
          )}
          <button
            onClick={salvarAgenda}
            disabled={saving || !hasChanges || !profissionalSelecionado}
            className="flex items-center w-full md:w-auto justify-center gap-2 px-6 py-2 h-10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{
              background: (hasChanges && profissionalSelecionado && !saving) ? C.pink600 : C.gray300,
              cursor:     (hasChanges && profissionalSelecionado && !saving) ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando…' : 'Salvar Agenda'}
          </button>
        </div>
      </div>

      {/* Aviso quando não há profissionais */}
      {!carregandoProfissionais && profissionaisInfo.length === 0 && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border mb-6 text-sm font-medium"
          style={{ background: amber50, borderColor: '#FFE066', color: amber600 }}>
          <UserX size={18} />
          <span>
            Nenhum profissional encontrado na tabela <strong>escalas_medicas</strong>.
            Verifique se os dados foram cadastrados corretamente.
          </span>
        </div>
      )}

      {/* ── Info do profissional selecionado ── */}
      {profissionalAtual && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6" style={{ background: C.pink50 }}>
          <AvatarProfissional info={profissionalAtual} size="md" />
          <div>
            <p className="text-sm font-bold" style={{ color: C.gray800 }}>{profissionalAtual.nome}</p>
            {profissionalAtual.municipio && (
              <p className="text-xs flex items-center gap-1" style={{ color: C.gray500 }}>
                <MapPin size={12} /> {profissionalAtual.municipio}
              </p>
            )}
          </div>
          <span className="ml-auto text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'white', color: C.pink600 }}>
            {Object.keys(agenda).length} dias com agenda
          </span>
        </div>
      )}

      {/* ── Conteúdo principal (opaco quando sem profissional) ── */}
      <div className={`transition-opacity duration-300 ${!profissionalSelecionado ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={20} style={{ color: C.pink600 }} />
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: C.gray800 }}>
                Agenda de Atendimento
              </h2>
            </div>
            <p className="text-sm font-medium" style={{ color: C.gray500 }}>
              Clique em qualquer data para definir os horários disponíveis naquele dia.
            </p>
          </div>
          <div className="px-5 py-2.5 rounded-xl border text-center shadow-sm" style={{ background: C.pink50, borderColor: C.pink100 }}>
            <p className="text-xl font-extrabold leading-none" style={{ color: C.pink600 }}>{totalVagasGeral}</p>
            <p className="text-xs mt-1 font-bold" style={{ color: C.pink800 }}>Vagas agendadas</p>
          </div>
        </div>

        {/* ── Layout: Calendário + Editor ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Calendário */}
          <div className="lg:col-span-3 bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: C.gray100 }}>

            {/* Navegação de mês */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: C.gray600 }}>
                <ChevronLeft size={18} />
              </button>

              <div className="text-center">
                <h3 className="text-base font-extrabold" style={{ color: C.gray800 }}>
                  {MESES_LABEL[calMonth]} {calYear}
                </h3>
                {totalVagasMes > 0 && (
                  <p className="text-xs font-semibold mt-0.5" style={{ color: C.pink600 }}>
                    {totalVagasMes} vagas neste mês
                  </p>
                )}
              </div>

              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-50 transition-colors" style={{ color: C.gray600 }}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Cabeçalhos dos dias */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS_ABREV.map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider py-1" style={{ color: C.gray400 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Células dos dias */}
            <div className="grid grid-cols-7 gap-1">
              {cellsDayMonth.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} />

                const key    = dateKey(calYear, calMonth, day)
                const isPast = isBeforeToday(key)
                const isHoje = key === todayKey()
                const slots  = getSlotsAtivos(key)
                const isSel  = dataSelecionada === key

                return (
                  <button
                    key={key}
                    disabled={isPast}
                    onClick={() => setDataSelecionada(isSel ? null : key)}
                    className="relative flex flex-col items-center justify-center rounded-xl py-2 min-h-[52px] transition-all duration-150"
                    style={{
                      background:  isSel  ? C.pink600 : slots > 0 ? C.pink50 : 'transparent',
                      borderWidth: isHoje ? 2 : 1,
                      borderStyle: 'solid',
                      borderColor: isSel  ? C.pink600 : isHoje ? C.pink400 : slots > 0 ? C.pink200 : 'transparent',
                      opacity:     isPast ? 0.28 : 1,
                      cursor:      isPast ? 'default' : 'pointer',
                    }}
                  >
                    <span className="text-sm font-bold leading-none" style={{ color: isSel ? '#fff' : isHoje ? C.pink600 : C.gray800 }}>
                      {day}
                    </span>

                    {slots > 0 ? (
                      <span
                        className="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none"
                        style={{
                          background: isSel ? 'rgba(255,255,255,0.25)' : C.pink100,
                          color:      isSel ? '#fff' : C.pink800,
                        }}
                      >
                        {slots}
                      </span>
                    ) : (
                      <span className="mt-1 w-1 h-1 rounded-full" style={{ background: isSel ? 'rgba(255,255,255,0.4)' : 'transparent' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: C.gray100 }}>
              {[
                { swatch: <div className="w-3 h-3 rounded-sm" style={{ background: C.pink50, border: `1px solid ${C.pink200}` }} />, label: 'Com vagas' },
                { swatch: <div className="w-3 h-3 rounded-sm" style={{ background: C.pink600 }} />,                                    label: 'Selecionado' },
                { swatch: <div className="w-3 h-3 rounded-sm border-2" style={{ borderColor: C.pink400 }} />,                          label: 'Hoje' },
                { swatch: <div className="w-3 h-3 rounded-sm" style={{ background: C.gray200 }} />,                                    label: 'Passado' },
              ].map(({ swatch, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {swatch}
                  <span className="text-[11px]" style={{ color: C.gray400 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Painel de edição de slots */}
          <div className="lg:col-span-2 lg:sticky lg:top-24">
            {dataSelecionada ? (
              <SlotEditor
                dateKey={dataSelecionada}
                onToggleSlot={toggleSlot}
                onToggleBloco={toggleBloco}
                onLimpar={limparDia}
                isSlotAtivo={isSlotAtivo}
                isBlocoEstado={isBlocoEstado}
                getSlotsAtivos={getSlotsAtivos}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed min-h-[300px]"
                style={{ borderColor: C.gray200 }}
              >
                <CalendarDays size={36} className="mb-3" style={{ color: C.gray200 }} />
                <p className="text-sm font-semibold" style={{ color: C.gray400 }}>Nenhum dia selecionado</p>
                <p className="text-xs mt-1 max-w-[180px]" style={{ color: C.gray300 }}>
                  Clique em uma data no calendário para gerenciar os horários
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
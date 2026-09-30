import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader2 } from 'lucide-react'
import { C } from '@/styles/palette'
import { supabase } from '@/lib/supabase'

interface CalendarProps {
  profissionalSelecionado: string
  diaSelecionado: string
  horarioSelecionado: string
  onSelectDia: (dia: string) => void
  onSelectHorario: (horario: string) => void
  showToast: (message: string, type: 'error' | 'warning' | 'success' | 'info') => void
}

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

interface Escala {
  id: string
  profissional: string
  data: string
  horarios: string[]
}

export default function Calendar({
  profissionalSelecionado,
  diaSelecionado,
  horarioSelecionado,
  onSelectDia,
  onSelectHorario,
  showToast
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [carregandoEscalas, setCarregandoEscalas] = useState(false)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([])
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const diasNoMes = new Date(currentYear, currentMonth + 1, 0).getDate()
  const primeiroDiaDoMes = new Date(currentYear, currentMonth, 1).getDay()
  const espacosVazios = Array.from({ length: primeiroDiaDoMes })
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  useEffect(() => {
    if (!profissionalSelecionado) {
      setEscalas([])
      return
    }

    const carregarEscalas = async () => {
      setCarregandoEscalas(true)
      try {
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
  }, [profissionalSelecionado, showToast])

  const isDiaDisponivel = useCallback((dataStr: string): boolean => {
    if (!profissionalSelecionado || escalas.length === 0) return false
    return escalas.some(escala => escala.data === dataStr && escala.horarios.length > 0)
  }, [profissionalSelecionado, escalas])

  const carregarHorariosDisponiveis = useCallback(async (dataStr: string) => {
    if (!profissionalSelecionado || !dataStr) {
      setHorariosDisponiveis([])
      return
    }

    setCarregandoHorarios(true)
    try {
      const { data: escalaDoDia, error: errorEscala } = await supabase
        .from('escalas_medicas')
        .select('horarios')
        .eq('profissional', profissionalSelecionado)
        .eq('data', dataStr)
        .maybeSingle()

      if (errorEscala) throw errorEscala

      if (!escalaDoDia || !escalaDoDia.horarios || escalaDoDia.horarios.length === 0) {
        setHorariosDisponiveis([])
        return
      }

      const horariosEscala = new Set<string>(
        escalaDoDia.horarios.map((h: string) => h.substring(0, 5))
      )

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
  }, [profissionalSelecionado, showToast])

  useEffect(() => {
    if (diaSelecionado) {
      carregarHorariosDisponiveis(diaSelecionado)
    } else {
      setHorariosDisponiveis([])
    }
  }, [diaSelecionado, carregarHorariosDisponiveis])

  const handleMudarMes = (direcao: 'anterior' | 'proximo') => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (direcao === 'anterior') {
        d.setMonth(prev.getMonth() - 1)
      } else {
        d.setMonth(prev.getMonth() + 1)
      }
      return d
    })
  }

  const verificarHorarioPassado = (horaStr: string): boolean => {
    if (!diaSelecionado) return false
    const agora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const [ano, mes, dia] = diaSelecionado.split('-').map(Number)
    const [hora, minuto]  = horaStr.split(':').map(Number)
    return new Date(ano, mes - 1, dia, hora, minuto) <= agora
  }

  return (
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

      {!profissionalSelecionado ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed" style={{ borderColor: C.gray200 }}>
          <Clock size={28} className="mb-2" style={{ color: C.gray200 }} />
          <p className="text-sm font-medium" style={{ color: C.gray400 }}>Selecione um profissional acima</p>
          <p className="text-xs mt-0.5" style={{ color: C.gray200 }}>para ver as datas disponíveis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4 px-1">
              <button
                onClick={() => handleMudarMes('anterior')}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600"
                style={{ borderColor: C.gray200, color: C.gray600 }}
              >
                <ChevronLeft size={15} />
              </button>
              <h3 className="font-heading font-semibold text-sm capitalize" style={{ color: C.gray800 }}>
                {MESES[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={() => handleMudarMes('proximo')}
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600"
                style={{ borderColor: C.gray200, color: C.gray600 }}
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
              {(() => {
                const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
                hoje.setHours(0, 0, 0, 0)
                
                return dias.map(dia => {
                  const dataStr = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                  const isSel   = diaSelecionado === dataStr
                  const dataAtual = new Date(currentYear, currentMonth, dia)
                  const isPast  = dataAtual < hoje
                  const isDisp  = !isPast && isDiaDisponivel(dataStr)

                  return (
                    <button
                      key={dia}
                      onClick={() => isDisp && onSelectDia(dataStr)}
                      disabled={!isDisp}
                      className={`h-9 flex items-center justify-center rounded-xl text-sm transition-all duration-150 relative ${
                        isSel ? 'bg-pink-600 text-white font-bold' : 
                        isDisp ? 'hover:bg-pink-50 hover:text-pink-600 underline underline-offset-4 decoration-pink-200' : 
                        'text-gray-400 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {dia}
                    </button>
                  )
                })
              })()}
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase mb-4 text-gray-400">
              <Clock size={13} className="text-pink-400" /> Horários disponíveis
            </h3>

            {carregandoHorarios ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 size={22} className="animate-spin text-pink-400" />
                <p className="text-xs">Verificando vagas...</p>
              </div>
            ) : diaSelecionado ? (
              horariosDisponiveis.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                  {horariosDisponiveis.map(hora => {
                    const isPassado = verificarHorarioPassado(hora)
                    const isSel     = horarioSelecionado === hora
                    return (
                      <button
                        key={hora}
                        disabled={isPassado}
                        onClick={() => onSelectHorario(hora)}
                        className={`py-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                          isSel ? 'bg-pink-600 text-white border-pink-600' :
                          isPassado ? 'text-gray-400 opacity-40 cursor-not-allowed' :
                          'text-gray-600 border-gray-200 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50'
                        }`}
                      >
                        {hora}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 rounded-xl border-2 border-dashed border-gray-200">
                  <Clock size={28} className="mb-2 text-gray-200" />
                  <p className="text-sm font-medium text-gray-400">Sem vagas disponíveis</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 rounded-xl border-2 border-dashed border-gray-200">
                <CalendarDays size={28} className="mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-400">Selecione uma data ao lado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAgendamentoStore } from '@/store/useAgendamentoStore'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, ArrowRight, CalendarDays, 
  ChevronLeft, ChevronRight, Loader2, Clock 
} from 'lucide-react'

export default function AgendamentoPage() {
  const router = useRouter()
  const { formData, setFormData } = useAgendamentoStore()
  const [loading, setLoading] = useState(false)

  // === LÓGICA DO CALENDÁRIO ===
  const [currentDate, setCurrentDate] = useState(new Date())
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const diasNoMes = new Date(currentYear, currentMonth + 1, 0).getDate()
  const primeiroDiaDoMes = new Date(currentYear, currentMonth, 1).getDay()
  const espacosVazios = Array.from({ length: primeiroDiaDoMes })
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1)

  const handleMudarMes = (direcao: 'anterior' | 'proximo') => {
    setCurrentDate(prev => {
      const novaData = new Date(prev)
      direcao === 'anterior' ? novaData.setMonth(prev.getMonth() - 1) : novaData.setMonth(prev.getMonth() + 1)
      return novaData
    })
  }

  const horarios = ['08:00', '08:30', '09:15', '10:00', '11:30', '14:00']

  // === LÓGICA DE TRAVA DE HORÁRIO (HORA DE BRASÍLIA) ===
  const verificarHorarioPassado = (horaStr: string) => {
    if (!formData.dia) return false

    // Pega o exato momento atual forçando o fuso horário de Brasília
    const dataAtualBrasilia = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    const agora = new Date(dataAtualBrasilia)

    // Monta a data e hora do agendamento que o usuário está olhando
    const [ano, mes, dia] = formData.dia.split('-').map(Number)
    const [hora, minuto] = horaStr.split(':').map(Number)
    
    // O mês em JS começa no 0, então diminuímos 1
    const dataAgendamento = new Date(ano, mes - 1, dia, hora, minuto)

    // Retorna true se a data/hora do agendamento já passou
    return dataAgendamento <= agora
  }

  // === FUNÇÃO DE ENVIO SIMPLIFICADA ===
  const handleAvancar = async () => {
    if (!formData.dia || !formData.horario) {
      alert("Por favor, selecione um dia e um horário.")
      return
    }

    setLoading(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        alert("Sessão expirada. Faça login novamente.")
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('agendamentos')
        .insert([
          {
            user_id: user.id,
            data_agendamento: formData.dia, 
            horario_agendamento: `${formData.horario}:00`,  
            status: 'pendente'
          }
        ])

      if (error) throw error

      router.push('/dashboard/confirmacao')

    } catch (error: any) {
      console.error("Erro ao salvar:", error)
      alert(`Erro técnico: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="animate-fade-in">
      <div className="mb-10">
        <button 
          onClick={() => router.back()} 
          className="text-gray-500 hover:text-primary flex items-center gap-2 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-textBase mb-2">Novo Agendamento</h1>
        <p className="text-gray-600">Selecione a data e o horário para sua consulta.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3 space-y-8">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-gray-100">
            <h2 className="font-heading font-bold text-xl mb-6 flex items-center gap-2">
              <CalendarDays className="text-secondary" /> Calendário de Consultas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendário */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => handleMudarMes('anterior')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft size={18}/>
                  </button>
                  <h3 className="font-semibold text-textBase capitalize">
                    {meses[currentMonth]} {currentYear}
                  </h3>
                  <button onClick={() => handleMudarMes('proximo')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight size={18}/>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-gray-400 py-2">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {espacosVazios.map((_, i) => <div key={`empty-${i}`} className="w-10 h-10"></div>)}
                  {dias.map(dia => {
                    const dataFormatada = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                    const isSelecionado = formData.dia === dataFormatada
                    
                    // Trava do Dia Passado (Hora de Brasília)
                    const dataAtualBrasilia = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
                    const hoje = new Date(dataAtualBrasilia)
                    hoje.setHours(0, 0, 0, 0)
                    const diaAtualLoop = new Date(currentYear, currentMonth, dia)
                    const isDiaPassado = diaAtualLoop < hoje

                    return (
                      <button 
                        key={dia}
                        onClick={() => setFormData({ ...formData, dia: dataFormatada, horario: '' })}
                        disabled={isDiaPassado}
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-all
                          ${isSelecionado ? 'bg-primary text-white shadow-md' : ''}
                          ${!isSelecionado && !isDiaPassado ? 'hover:bg-primary/10 text-textBase' : ''}
                          ${isDiaPassado ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {dia}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Horários */}
              <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                <h3 className="font-semibold text-textBase mb-4 flex items-center gap-2">
                   <Clock size={18} className="text-secondary" /> Horários
                </h3>
                
                {formData.dia ? (
                  <div className="grid grid-cols-2 gap-3">
                    {horarios.map(hora => {
                      const isPassado = verificarHorarioPassado(hora)
                      const isSelecionado = formData.horario === hora

                      return (
                        <button 
                          key={hora}
                          disabled={isPassado}
                          onClick={() => setFormData({ ...formData, horario: hora })}
                          className={`border rounded-xl py-2.5 text-sm font-medium transition-all
                            ${isPassado 
                              ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed opacity-60' 
                              : isSelecionado 
                                ? 'border-primary text-primary bg-primary/5' 
                                : 'border-gray-200 text-gray-600 hover:border-primary'
                            }
                          `}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Selecione uma data no calendário para ver os horários disponíveis.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleAvancar}
              disabled={loading || !formData.dia || !formData.horario}
              className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30 transform hover:-translate-y-1 transition-all duration-300 font-bold py-4 px-8 rounded-xl flex items-center gap-2 text-lg w-full sm:w-auto justify-center disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Processando...</> : <>Finalizar Agendamento <ArrowRight size={20} /></>}
            </button>
          </div>
        </div>

        {/* PROGRESSO */}
        <aside className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 sticky top-28">
            <h3 className="font-heading font-bold text-lg mb-6 text-primary">Status do Agendamento</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Data escolhida:</span>
                <span className="font-bold text-textBase">{formData.dia ? formData.dia.split('-').reverse().join('/') : 'Pendente'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horário:</span>
                <span className="font-bold text-textBase">{formData.horario || 'Pendente'}</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                 <p className="text-xs text-gray-400 leading-relaxed">
                   Seu agendamento será salvo como <strong>pendente</strong> até a confirmação da clínica.
                 </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
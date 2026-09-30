'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, MapPin, ArrowLeft, CheckCircle2, Stethoscope } from 'lucide-react'
import { STORAGE_KEY_PATIENT_TOKEN, STORAGE_KEY_AGENDAMENTOS } from '@/lib/storage'

type AgendamentoLocal = {
  id: string
  data_agendamento: string
  horario_agendamento: string
  status: string
  profissional: string | null
}

// Chave usada para persistir consultas do paciente no localStorage
function carregarAgendamentos(cpf: string): AgendamentoLocal[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AGENDAMENTOS}_${cpf}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function salvarAgendamentos(cpf: string, agendamentos: AgendamentoLocal[]) {
  localStorage.setItem(`${STORAGE_KEY_AGENDAMENTOS}_${cpf}`, JSON.stringify(agendamentos))
}

export default function MeusAgendamentosPage() {
  const router = useRouter()
  
  // Pattern para evitar useEffect no carregamento inicial de dados síncronos (localStorage)
  const [init, setInit] = useState(false)
  const [agendamentos, setAgendamentos] = useState<AgendamentoLocal[]>([])
  const [loading, setLoading] = useState(true)
  const [cpfToken, setCpfToken] = useState<string | null>(null)

  if (typeof window !== 'undefined' && !init) {
    setInit(true)
    const token = localStorage.getItem(STORAGE_KEY_PATIENT_TOKEN)
    if (token) {
      setCpfToken(token)
      let lista = carregarAgendamentos(token)
      const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      hoje.setHours(0, 0, 0, 0)
      lista = lista.filter(ag => {
        const [ano, mes, dia] = ag.data_agendamento.split('-').map(Number)
        return new Date(ano, mes - 1, dia) >= hoje
      })
      salvarAgendamentos(token, lista)
      setAgendamentos(lista)
    }
    setLoading(false)
  }

  const formatarData = (data: string) => data.split('-').reverse().join('/')
  const formatarHora = (hora: string) => hora.substring(0, 5)

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans animate-fade-in">

      {/* CABEÇALHO */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-500 hover:text-primary flex items-center gap-2 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar ao Início
        </button>
        <h1 className="font-extrabold text-3xl text-gray-900 mb-1">Minhas Consultas</h1>
        <p className="text-gray-600">Acompanhe o status dos seus agendamentos.</p>
      </div>

      {/* ESTADO DE CARREGAMENTO */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin border-primary mb-4" />
          <p>Buscando seus agendamentos...</p>
        </div>
      )}

      {/* RESULTADOS OU ESTADO VAZIO */}
      {!loading && (
        <div className="space-y-4">
          {!cpfToken || agendamentos.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-10 rounded-3xl text-center">
              <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-bold text-gray-700 text-lg">Nenhum agendamento encontrado</h3>
              <p className="text-gray-500 mt-1 max-w-md mx-auto">
                Não encontramos consultas registradas neste dispositivo ou todas as consultas já passaram.
              </p>
              <button
                onClick={() => router.push('/dashboard/agendamento')}
                className="mt-6 inline-block bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Fazer um Agendamento
              </button>
            </div>
          ) : (
            agendamentos.map((ag) => (
              <div key={ag.id} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">

                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-3 text-lg font-bold text-gray-900">
                    <span className="flex items-center gap-1.5"><CalendarDays size={20} className="text-primary"/> {formatarData(ag.data_agendamento)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1.5"><Clock size={20} className="text-primary"/> {formatarHora(ag.horario_agendamento)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                    <MapPin size={16} />
                    {ag.profissional || 'Localização não definida'}
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border ${
                    ag.status === 'agendado' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    ag.status === 'aguardando' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    ag.status === 'em_atendimento' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-green-50 text-green-600 border-green-200'
                }`}>
                  {ag.status === 'agendado' && <CalendarDays size={16} />}
                  {ag.status === 'aguardando' && <Clock size={16} />}
                  {ag.status === 'em_atendimento' && <Stethoscope size={16} />}
                  {ag.status === 'finalizado' && <CheckCircle2 size={16} />}
                  <span className="capitalize">{ag.status === 'agendado' ? 'Agendado' : ag.status === 'aguardando' ? 'Aguardando' : ag.status === 'em_atendimento' ? 'Em Atendimento' : 'Finalizado'}</span>
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

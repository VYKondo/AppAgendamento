'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Search, CheckCircle2, Clock, CalendarDays,
  ShieldAlert, Loader2
} from 'lucide-react'
import { C } from '@/styles/palette'

import { EMAIL_TO_MUNICIPIO, RECEPTION_EMAILS } from '@/config/constants'
import { RealtimeChannel } from '@supabase/supabase-js'
import { formatarHora, formatarCPF } from '@/utils/formatters'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import Skeleton from '@/components/ui/Skeleton'

// ── Tipagens ────────────────────────────────────────────────────
interface Paciente {
  cpf: string
  nome_completo: string
  telefone: string
}

interface Agendamento {
  id: string
  paciente_cpf: string
  data_agendamento: string
  horario_agendamento: string
  status: string
  profissional: string | null
  paciente?: Paciente
}

export default function RecepcaoPage() {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [userMunicipio, setUserMunicipio] = useState<string>('')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const buscarDadosFila = useCallback(async (municipio: string) => {
    try {
      const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) 
      
      const { data: agendamentosData, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data_agendamento', hoje) 
        .neq('status', 'finalizado')
        .like('profissional', `%(${municipio})%`)
        .order('horario_agendamento', { ascending: true })

      if (error) throw error
      if (!agendamentosData || agendamentosData.length === 0) { setAgendamentos([]); return }

      const cpfs = [...new Set(agendamentosData.map((a) => a.paciente_cpf).filter(Boolean))]
      
      if (cpfs.length === 0) {
        setAgendamentos(agendamentosData)
        return
      }

      const { data: pacientesData, error: pError } = await supabase
        .from('pacientes')
        .select('cpf, nome_completo, telefone')
        .in('cpf', cpfs)

      if (pError) throw pError

      setAgendamentos(agendamentosData.map((ag) => ({
        ...ag,
        paciente: pacientesData?.find((p: Paciente) => p.cpf === ag.paciente_cpf),
      })))
    } catch (error) {
      console.error('Erro ao buscar dados da fila:', error)
      showToast('Erro ao carregar a fila.', 'error')
    }
  }, [showToast])

  useEffect(() => {
    let isMounted = true
    let subscription: RealtimeChannel

    const checkAccessAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        
        if (!session) {
          router.push('/medico?redirectTo=/dashboard/recepcao')
          return
        }

        const email = session.user.email || ''
        if (!(RECEPTION_EMAILS as readonly string[]).includes(email)) {
          if (isMounted) {
            setIsAuthorized(false)
            setLoading(false)
          }
          return
        }

        const municipio = EMAIL_TO_MUNICIPIO[email]
        if (isMounted) {
          setUserMunicipio(municipio)
          setIsAuthorized(true)
        }
        
        await buscarDadosFila(municipio)
        if (isMounted) setLoading(false)

        subscription = supabase.channel('recepcao_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
            if (isMounted) buscarDadosFila(municipio)
          })
          .subscribe()
      } catch (error) {
        console.error('Erro na inicialização da recepção:', error)
        if (isMounted) {
          showToast('Erro ao carregar painel.', 'error')
          setLoading(false)
        }
      }
    }

    checkAccessAndFetch()

    return () => { 
      isMounted = false
      if (subscription) supabase.removeChannel(subscription) 
    }
  }, [router, buscarDadosFila, showToast])

  const fazerCheckIn = async (id: string) => {
    if (actionLoadingId) return
    setActionLoadingId(id)
    try {
      const { error } = await supabase.from('agendamentos').update({ status: 'aguardando' }).eq('id', id)
      if (error) throw error
      showToast('Check-in realizado! Paciente enviado para o médico.', 'success')
    } catch (error) {
      console.error('Erro no check-in:', error)
      showToast('Erro ao fazer check-in.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const registrarFalta = async (id: string) => {
    if (actionLoadingId) return
    if (!window.confirm("Confirmar que o paciente faltou? A consulta será cancelada.")) return
    
    setActionLoadingId(id)
    try {
      const { error } = await supabase.from('agendamentos').update({ status: 'finalizado' }).eq('id', id)
      if (error) throw error
      showToast('Falta registrada e horário liberado.', 'info')
    } catch (error) {
      console.error('Erro ao registrar falta:', error)
      showToast('Erro ao registrar falta.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(ag => {
      const term = searchTerm.toLowerCase()
      return (ag.paciente?.nome_completo || '').toLowerCase().includes(term) || (ag.paciente_cpf || '').includes(term)
    })
  }, [agendamentos, searchTerm])

  const stats = useMemo(() => {
    return {
      filaEspera: agendamentosFiltrados.filter(a => a.status === 'aguardando').length,
      agendadosRestantes: agendamentosFiltrados.filter(a => a.status === 'agendado').length
    }
  }, [agendamentosFiltrados])

  const { filaEspera, agendadosRestantes } = stats;

  if (loading) return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton width={200} height={32} />
          <Skeleton width={150} height={20} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={100} height={40} />
          <Skeleton width={100} height={40} />
        </div>
      </div>
      <Skeleton width="100%" height={60} />
      <div className="space-y-4">
        {[1,2,3,4].map(i => <Skeleton key={i} width="100%" height={80} />)}
      </div>
    </div>
  )

  if (isAuthorized === false) return (
    <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col items-center max-w-md">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Acesso Restrito</h2>
        <p className="text-sm text-red-700">Seu usuário não possui autorização para acessar esta área.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold">Voltar ao Painel</button>
      </div>
    </div>
  )

  return (
    <section className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-3">
          <div className={`px-5 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-sm font-bold max-w-md ${
            toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            'bg-sky-50 text-sky-800 border-sky-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-extrabold text-2xl" style={{ color: C.gray800 }}>Recepção & Check-in</h1>
          <p className="text-sm text-gray-500">Unidade: <span className="font-bold text-pink-600">{userMunicipio}</span></p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white rounded-xl border text-xs font-bold text-gray-600 shadow-sm flex items-center gap-2">
            <CalendarDays size={14} /> {agendadosRestantes} Pendentes
          </div>
          <div className="px-4 py-2 rounded-xl border text-xs font-bold shadow-sm flex items-center gap-2" style={{ background: '#FFFBEB', color: '#92400E', borderColor: '#FEF3C7' }}>
            <Clock size={14} /> {filaEspera} Na Espera
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Buscar paciente por nome ou CPF..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {agendamentosFiltrados.length === 0 ? (
          <div className="p-16 text-center text-gray-400">Nenhum paciente para hoje.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agendamentosFiltrados.map(ag => {
              const isActing = actionLoadingId === ag.id
              return (
                <div key={ag.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar nome={ag.paciente?.nome_completo || '?'} />
                    <div>
                      <p className="font-bold text-sm text-gray-800">{ag.paciente?.nome_completo}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                        <span className="font-mono">{formatarCPF(ag.paciente_cpf)}</span>
                        <span className="flex items-center gap-1"><Clock size={11}/> {formatarHora(ag.horario_agendamento)}</span>
                        <span className="text-pink-600 font-bold">{ag.profissional}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {ag.status === 'agendado' ? (
                      <>
                        <button onClick={() => registrarFalta(ag.id)} disabled={isActing} className="px-3 py-2 text-xs font-bold text-gray-500 border rounded-lg hover:bg-red-50">
                          {isActing ? '...' : 'Faltou'}
                        </button>
                        <button onClick={() => fazerCheckIn(ag.id)} disabled={isActing} className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-lg shadow-md flex items-center justify-center gap-2">
                          {isActing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Check-in
                        </button>
                      </>
                    ) : (
                      <div className="w-full sm:w-auto">
                        <StatusBadge status={ag.status} />
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

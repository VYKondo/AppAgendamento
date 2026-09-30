'use client'

import { useEffect, useState, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Skeleton from '@/components/ui/Skeleton'
import { formatarData, formatarHora, formatarCPF } from '@/utils/formatters'
import StatusBadge from '@/components/ui/StatusBadge'
import Avatar from '@/components/ui/Avatar'
import ReadField from '@/components/ui/ReadField'
import Section from '@/components/ui/Section'
import EditInput from '@/components/ui/EditInput'
import {
  CalendarDays, Search, Loader2,
  Phone, MapPin, X, User, Home, Heart, ChevronDown
} from 'lucide-react'
import { C } from '@/styles/palette'

// ── Tipagens ────────────────────────────────────────────────────
interface Paciente {
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

interface Agendamento {
  id: string
  paciente_cpf: string
  data_agendamento: string
  horario_agendamento: string
  status: string
  profissional: string | null
  paciente?: Paciente
}

// ── Página principal ────────────────────────────────────────────
export default function ConsultasPage() {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')

  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' | 'info'; id: number } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'warning') => {
    setToast({ message, type, id: Date.now() })
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Paciente>>({})
  const [editAgendamentoForm, setEditAgendamentoForm] = useState<Partial<Agendamento>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const toggleRow = (id: string) => {
    if (editingId) { showToast('Salve ou descarte as alterações antes de continuar.', 'warning'); return }
    setExpandedRow(expandedRow === id ? null : id)
  }

  useEffect(() => {
    let isMounted = true;
    
    const verificarAcessoEBuscarDados = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return;
        if (!session) return router.push('/medico')

        const { data: agendamentosData, error } = await supabase
          .from('agendamentos')
          .select('*, paciente:pacientes(*)')
          .order('data_agendamento', { ascending: true })
          .order('horario_agendamento', { ascending: true })

        if (error) throw error
        if (!isMounted) return;
        
        setAgendamentos(agendamentosData || [])
      } catch (error) {
        console.error('Erro ao carregar consultas:', error)
        if (isMounted) showToast('Erro ao carregar os dados.', 'error')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    verificarAcessoEBuscarDados()

    const subscription = supabase.channel('consultas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
        verificarAcessoEBuscarDados()
      })
      .subscribe()

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription)
    }
  }, [router])

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
    if (!editingId || savingEdit) return
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
      setEditingId(null)
    } catch { 
      showToast('Erro ao atualizar os dados.', 'error') 
    } finally { 
      setSavingEdit(false) 
    }
  }

  const alterarStatusConsulta = async (id: string, novoStatus: string) => {
    if (actionLoadingId) return
    setActionLoadingId(id)
    try {
      const { error } = await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', id)
      if (error) throw error
      showToast(`Consulta atualizada para ${novoStatus.replace('_', ' ')}!`, 'success')
    } catch { 
      showToast('Erro ao alterar o status.', 'error') 
    } finally {
      setActionLoadingId(null)
    }
  }

  const finalizarEChamarProximo = async (idAtual: string, profissional: string) => {
    if (actionLoadingId) return
    setActionLoadingId(idAtual)
    try {
      await supabase.from('agendamentos').update({ status: 'finalizado' }).eq('id', idAtual)

      const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
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
    } catch { 
      showToast('Erro ao processar a fila de espera.', 'error') 
    } finally {
      setActionLoadingId(null)
    }
  }

  const deletarAgendamento = async (id: string) => {
    if (actionLoadingId) return
    if (!window.confirm("Tem certeza que deseja cancelar e excluir este agendamento? Esta ação não pode ser desfeita.")) return;
    
    setActionLoadingId(id)
    try {
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
      showToast('Agendamento removido com sucesso!', 'success')
    } catch { 
      showToast('Erro ao excluir o agendamento.', 'error') 
    } finally {
      setActionLoadingId(null)
    }
  }

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(ag => {
      const nome  = ag.paciente?.nome_completo || ''
      const busca = searchTerm.toLowerCase()
      return (nome.toLowerCase().includes(busca) || (ag.paciente_cpf || '').includes(busca))
    })
  }, [agendamentos, searchTerm])

  const stats = useMemo(() => {
    return {
      total: agendamentos.length
    }
  }, [agendamentos])

  const { total } = stats;

  const renderFichaPaciente = (paciente: Paciente, isEditingThis: boolean) => (
    <div className="flex flex-col gap-8">
      <Section icon={<User size={14} />} title="Dados básicos">
        {isEditingThis ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-12"><EditInput label="Nome completo" value={editForm.nome_completo || ''} onChange={v => setEditForm({ ...editForm, nome_completo: v })} /></div>
            <div className="sm:col-span-3"><ReadField label="CPF" value={formatarCPF(paciente.cpf)} mono /></div>
            <div className="sm:col-span-3"><EditInput label="CNS" value={editForm.cns || ''} onChange={v => setEditForm({ ...editForm, cns: v })} /></div>
            <div className="sm:col-span-3"><EditInput label="Nascimento" type="date" value={editForm.data_nascimento || ''} onChange={v => setEditForm({ ...editForm, data_nascimento: v })} /></div>
            <div className="sm:col-span-3"><EditInput label="Telefone" value={editForm.telefone || ''} onChange={v => setEditForm({ ...editForm, telefone: v })} /></div>
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

      <Section icon={<Heart size={14} />} title="Família e Identidade">
        {isEditingThis ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6"><EditInput label="Nome da mãe" value={editForm.nome_mae || ''} onChange={v => setEditForm({ ...editForm, nome_mae: v })} /></div>
            <div className="sm:col-span-6"><EditInput label="Nome do pai" value={editForm.nome_pai || ''} onChange={v => setEditForm({ ...editForm, nome_pai: v })} /></div>
            <div className="sm:col-span-6"><EditInput label="Nome social" value={editForm.nome_social || ''} onChange={v => setEditForm({ ...editForm, nome_social: v })} /></div>
            <div className="sm:col-span-6"><EditInput label="Gênero" value={editForm.identidade_genero || ''} onChange={v => setEditForm({ ...editForm, identidade_genero: v })} /></div>
            <div className="sm:col-span-6"><EditInput label="Orientação" value={editForm.orientacao_sexual || ''} onChange={v => setEditForm({ ...editForm, orientacao_sexual: v })} /></div>
            <div className="sm:col-span-6"><EditInput label="Nacionalidade" value={editForm.nacionalidade || ''} onChange={v => setEditForm({ ...editForm, nacionalidade: v })} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6"><ReadField label="Mãe" value={paciente.nome_mae} /></div>
            <div className="sm:col-span-6"><ReadField label="Pai" value={paciente.nome_pai} /></div>
            <div className="sm:col-span-6"><ReadField label="Social" value={paciente.nome_social} /></div>
            <div className="sm:col-span-6"><ReadField label="Gênero" value={paciente.identidade_genero} /></div>
            <div className="sm:col-span-6"><ReadField label="Orientação" value={paciente.orientacao_sexual} /></div>
            <div className="sm:col-span-6"><ReadField label="Nacionalidade" value={paciente.nacionalidade} /></div>
          </div>
        )}
      </Section>

      <Section icon={<Home size={14} />} title="Endereço">
        {isEditingThis ? (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3"><EditInput label="CEP" value={editForm.cep || ''} onChange={v => setEditForm({ ...editForm, cep: v })} /></div>
            <div className="sm:col-span-7"><EditInput label="Logradouro" value={editForm.logradouro || ''} onChange={v => setEditForm({ ...editForm, logradouro: v })} /></div>
            <div className="sm:col-span-2"><EditInput label="Nº" value={editForm.numero || ''} onChange={v => setEditForm({ ...editForm, numero: v })} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3"><ReadField label="CEP" value={paciente.cep} mono /></div>
            <div className="sm:col-span-7"><ReadField label="Logradouro" value={paciente.logradouro} icon={<MapPin size={12}/>} /></div>
            <div className="sm:col-span-2"><ReadField label="Nº" value={paciente.numero} /></div>
          </div>
        )}
      </Section>
    </div>
  )

  return (
    <section className="animate-fade-in relative space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-3 fade-in">
          <div className={`px-5 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-sm font-bold ${
            toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            'bg-sky-50 text-sky-800 border-sky-200'
          }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl" style={{ color: C.gray800 }}>Painel de Consultas</h1>
          <p className="text-sm text-gray-500">Gerencie agendamentos e acompanhe a fila.</p>
        </div>
        <div className="flex gap-2">
          {loading ? (
            <Skeleton width={120} height={40} className="rounded-xl" />
          ) : (
            <div className="px-4 py-2 bg-white rounded-xl border flex items-center gap-2 text-xs font-bold text-gray-600 shadow-sm">
              <CalendarDays size={14} /> {total} Registros
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar por nome ou CPF..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-3 text-sm rounded-xl border outline-none focus:border-pink-400"
          />
        </div>
        {/* ... filters ... */}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton width="40%" height={20} />
                <Skeleton width="20%" height={20} />
                <Skeleton width="15%" height={20} />
                <Skeleton width="10%" height={20} />
              </div>
            ))}
          </div>
        ) : agendamentosFiltrados.length === 0 ? (
          <div className="p-20 text-center text-gray-400">Nenhuma consulta encontrada.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {agendamentosFiltrados.map(ag => {
              const isExpanded = expandedRow === ag.id
              const isActing = actionLoadingId === ag.id
              
              return (
                <Fragment key={ag.id}>
                  <div 
                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-pink-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleRow(ag.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar nome={ag.paciente?.nome_completo || '?'} />
                      <div>
                        <p className="font-bold text-sm text-gray-800">{ag.paciente?.nome_completo}</p>
                        <p className="text-[10px] font-mono text-gray-400">{formatarCPF(ag.paciente_cpf)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-xs">
                        <p className="font-bold text-gray-700">{formatarData(ag.data_agendamento)}</p>
                        <p className="text-gray-400">{formatarHora(ag.horario_agendamento)}</p>
                      </div>
                      <StatusBadge status={ag.status} />
                      {isActing ? <Loader2 size={16} className="animate-spin text-pink-600" /> : <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-6 border-t bg-white animate-in slide-in-from-top-2">
                      {ag.paciente && renderFichaPaciente(ag.paciente, editingId === ag.id)}
                      
                      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                        {editingId === ag.id ? (
                          <>
                            <button onClick={cancelarEdicao} className="px-4 py-2 text-xs font-bold rounded-lg border text-gray-600">Cancelar</button>
                            <button onClick={salvarEdicao} disabled={savingEdit} className="px-4 py-2 text-xs font-bold rounded-lg bg-pink-600 text-white disabled:opacity-50">
                              {savingEdit ? 'Salvando...' : 'Salvar'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => deletarAgendamento(ag.id)} disabled={isActing} className="px-4 py-2 text-xs font-bold text-red-600">Excluir</button>
                            <button onClick={() => iniciarEdicao(ag)} disabled={isActing} className="px-4 py-2 text-xs font-bold rounded-lg border text-pink-600">Editar</button>
                            {ag.status === 'aguardando' && (
                              <button onClick={() => alterarStatusConsulta(ag.id, 'em_atendimento')} disabled={isActing} className="px-4 py-2 text-xs font-bold rounded-lg bg-pink-600 text-white">
                                Iniciar Atendimento
                              </button>
                            )}
                            {ag.status === 'em_atendimento' && (
                              <button onClick={() => finalizarEChamarProximo(ag.id, ag.profissional || '')} disabled={isActing} className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white">
                                Finalizar e Chamar Próximo
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  CalendarDays, Clock, Search, Loader2, ChevronDown, ChevronUp, 
  Phone, CreditCard, Activity, MapPin, CheckCircle2, Users, 
  Edit3, Save, X, AlertTriangle, XCircle, Info, Filter, Stethoscope
} from 'lucide-react'

// Tipagens
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
  profissional: string | null // NOVO CAMPO ADICIONADO
  paciente?: Paciente
}

// LISTA DE PROFISSIONAIS
const LISTA_PROFISSIONAIS = [
  "Gleiciane (município A)",
  "Carlos (município B)",
  "Adriana (município C)"
]

export default function ConsultasPage() {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  
  // === SISTEMA DE BUSCA E FILTROS ===
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [profissionalFilter, setProfissionalFilter] = useState('todos') // NOVO FILTRO

  // === SISTEMA DE UI / UX ===
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'warning' | 'success' | 'info', id: number } | null>(null)

  // === SISTEMA DE EDIÇÃO DE PACIENTE ===
  const [editingCpf, setEditingCpf] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Paciente>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const showToast = (message: string, type: 'error' | 'warning' | 'success' | 'info' = 'warning') => {
    setToast({ message, type, id: Date.now() })
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    verificarAcessoEBuscarDados()
  }, [])

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
      
      if (!agendamentosData || agendamentosData.length === 0) {
        setAgendamentos([])
        return
      }

      const cpfs = [...new Set(agendamentosData.map(a => a.paciente_cpf).filter(Boolean))]

      const { data: pacientesData, error: pacientesError } = await supabase
        .from('pacientes')
        .select('*')
        .in('cpf', cpfs)

      if (pacientesError) throw pacientesError

      const agendamentosCompletos = agendamentosData.map(ag => {
        const fichaDoPaciente = pacientesData?.find(p => p.cpf === ag.paciente_cpf)
        return { ...ag, paciente: fichaDoPaciente }
      })

      setAgendamentos(agendamentosCompletos)
    } catch (error) {
      console.error("Erro ao carregar consultas:", error)
      showToast("Erro ao carregar os dados.", "error")
    } finally {
      setLoading(false)
    }
  }

  // === FUNÇÕES DE EDIÇÃO (PACIENTE E AGENDAMENTO) ===
  const iniciarEdicao = (paciente: Paciente) => {
    setEditingCpf(paciente.cpf)
    setEditForm(paciente)
  }

  const cancelarEdicao = () => {
    setEditingCpf(null)
    setEditForm({})
  }

  const salvarEdicao = async () => {
    if (!editingCpf) return
    setSavingEdit(true)

    try {
      const { error } = await supabase.from('pacientes').update(editForm).eq('cpf', editingCpf)
      if (error) throw error

      showToast("Ficha do paciente atualizada com sucesso!", "success")
      await verificarAcessoEBuscarDados()
      setEditingCpf(null)
    } catch (error: any) {
      showToast("Erro ao atualizar os dados.", "error")
    } finally {
      setSavingEdit(false)
    }
  }

  const alterarStatusConsulta = async (agendamentoId: string, novoStatus: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', agendamentoId)
      if (error) throw error

      showToast(`Consulta ${novoStatus} com sucesso!`, "success")
      verificarAcessoEBuscarDados()
    } catch (error) {
      showToast("Erro ao alterar o status.", "error")
    }
  }

  // NOVO: Função para atribuir/mudar o profissional da consulta
  const alterarProfissionalConsulta = async (agendamentoId: string, novoProfissional: string) => {
    try {
      const { error } = await supabase.from('agendamentos').update({ profissional: novoProfissional }).eq('id', agendamentoId)
      if (error) throw error

      showToast(`Profissional atualizado com sucesso!`, "success")
      verificarAcessoEBuscarDados()
    } catch (error) {
      showToast("Erro ao alterar profissional.", "error")
    }
  }

  // Funções Utilitárias
  const formatarData = (data?: string) => data ? data.split('-').reverse().join('/') : ''
  const formatarHora = (hora?: string) => hora ? hora.substring(0, 5) : ''
  const formatarCPF = (cpf: string) => cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : ''
  const getIniciais = (nome: string) => {
    if (!nome) return '?'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // === LÓGICA DE FILTROS ===
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const nome = ag.paciente?.nome_completo || ''
    const cpf = ag.paciente_cpf || ''
    const busca = searchTerm.toLowerCase()
    
    const matchBusca = nome.toLowerCase().includes(busca) || cpf.includes(busca)
    const matchStatus = statusFilter === 'todos' || ag.status === statusFilter
    
    // NOVO FILTRO
    const matchProfissional = profissionalFilter === 'todos' || ag.profissional === profissionalFilter

    return matchBusca && matchStatus && matchProfissional
  })

  const toggleRow = (id: string) => {
    if (editingCpf) {
      showToast("Guarde ou cancele as alterações antes de mudar de paciente.", "warning")
      return
    }
    setExpandedRow(expandedRow === id ? null : id)
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-gray-500 font-medium animate-pulse">Carregando painel médico...</p>
    </div>
  )

  return (
    <section className="animate-fade-in pb-10 relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md font-medium text-sm transition-all ${
            toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
            toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
            toast.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800' :
            'bg-amber-50/90 border-amber-200 text-amber-800'
          }`}>
            {toast.type === 'error' && <XCircle size={20} className="shrink-0 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle size={20} className="shrink-0 text-amber-500" />}
            {toast.type === 'success' && <CheckCircle2 size={20} className="shrink-0 text-green-500" />}
            {toast.type === 'info' && <Info size={20} className="shrink-0 text-blue-500" />}
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      {/* CABEÇALHO DINÂMICO E BUSCA */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-textBase mb-1 flex items-center gap-3">
            <Activity className="text-primary" /> Painel de Consultas
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Pesquise, filtre e atualize os prontuários dos pacientes.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
          {/* Campo de Busca Texto */}
          <div className="relative w-full sm:w-64 flex-grow">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            />
          </div>

          {/* NOVO: Filtro de Profissional / Município */}
          <div className="relative w-full sm:w-56">
            <Stethoscope size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={profissionalFilter} onChange={(e) => setProfissionalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="todos">Todos os Municípios</option>
              {LISTA_PROFISSIONAIS.map(prof => (
                <option key={prof} value={prof}>{prof}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro de Status */}
          <div className="relative w-full sm:w-44">
            <Filter size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="todos">Status (Todos)</option>
              <option value="pendente">Pendentes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE PACIENTES */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-xs font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Profissional / Local</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              
              {agendamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhum agendamento encontrado com estes filtros.
                  </td>
                </tr>
              ) : (
                agendamentosFiltrados.map((ag) => {
                  const isExpanded = expandedRow === ag.id
                  const paciente = ag.paciente
                  const isEditingThis = editingCpf === ag.paciente_cpf

                  const nome = paciente?.nome_completo || 'Paciente Não Identificado'
                  const cpf = ag.paciente_cpf ? formatarCPF(ag.paciente_cpf) : 'Sem CPF'
                  
                  return (
                    <Fragment key={ag.id}>
                      {/* LINHA PRINCIPAL */}
                      <tr 
                        onClick={() => toggleRow(ag.id)}
                        className={`transition-colors ${isExpanded ? 'bg-primary/5' : 'hover:bg-gray-50 cursor-pointer'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                              {getIniciais(nome)}
                            </div>
                            <div>
                              <p className="font-bold text-textBase">{nome}</p>
                              <p className="text-xs text-gray-400 font-medium">CPF: {cpf}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-2 text-textBase font-medium">
                              <CalendarDays size={14} className="text-secondary"/> 
                              {formatarData(ag.data_agendamento)}
                            </span>
                            <span className="flex items-center gap-2 text-gray-500 text-xs">
                              <Clock size={14} className="text-secondary"/> 
                              {formatarHora(ag.horario_agendamento)}
                            </span>
                          </div>
                        </td>
                        {/* NOVO: Coluna de Profissional */}
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 text-textBase font-medium text-sm">
                            <Stethoscope size={14} className="text-primary/70"/>
                            {ag.profissional || <span className="text-gray-400 italic">Não atribuído</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                            ag.status === 'pendente' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                            ag.status === 'confirmado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {ag.status === 'confirmado' && <CheckCircle2 size={14} />}
                            {ag.status === 'pendente' && <Clock size={14} />}
                            {ag.status === 'cancelado' && <XCircle size={14} />}
                            <span className="capitalize">{ag.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm transition-colors">
                            {isExpanded ? 'Recolher Ficha' : 'Abrir Ficha'}
                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                        </td>
                      </tr>

                      {/* LINHA EXPANSÍVEL */}
                      {isExpanded && paciente && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50/80 border-b-2 border-primary/20 p-0 whitespace-normal">
                            <div className="px-6 py-6 animate-in slide-in-from-top-2 fade-in duration-300">
                              
                              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                  {isEditingThis ? 'Editando Ficha Cadastral' : 'Ficha Cadastral do Paciente'}
                                </h4>
                                
                                {!isEditingThis && (
                                  <button onClick={() => iniciarEdicao(paciente)} className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                    <Edit3 size={16} /> Editar Dados
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                {/* BLOCO 1: PESSOAIS */}
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative">
                                  <h5 className="font-bold text-textBase flex items-center gap-2 mb-4">
                                    <CreditCard size={18} className="text-primary"/> Dados Básicos
                                  </h5>
                                  
                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Nome Completo</label>
                                    {isEditingThis ? (
                                      <input type="text" value={editForm.nome_completo || ''} onChange={e => setEditForm({...editForm, nome_completo: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                                    ) : <p className="text-sm font-medium text-gray-900">{paciente.nome_completo}</p>}
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">CNS (Cartão SUS)</label>
                                    {isEditingThis ? (
                                      <input type="text" value={editForm.cns || ''} onChange={e => setEditForm({...editForm, cns: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono" />
                                    ) : <p className="text-sm font-medium text-gray-900 font-mono">{paciente.cns}</p>}
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Data Nasc. / Telefone</label>
                                    {isEditingThis ? (
                                      <div className="flex gap-2">
                                        <input type="date" value={editForm.data_nascimento || ''} onChange={e => setEditForm({...editForm, data_nascimento: e.target.value})} className="w-1/2 text-sm p-2 border border-gray-300 rounded-lg outline-none" />
                                        <input type="text" value={editForm.telefone || ''} onChange={e => setEditForm({...editForm, telefone: e.target.value})} className="w-1/2 text-sm p-2 border border-gray-300 rounded-lg outline-none" placeholder="Telefone" />
                                      </div>
                                    ) : (
                                      <p className="text-sm font-medium text-gray-900">
                                        {formatarData(paciente.data_nascimento)} &nbsp;•&nbsp; {paciente.telefone}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* BLOCO 2: INFORMAÇÕES SOCIAIS */}
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative">
                                  <h5 className="font-bold text-textBase flex items-center gap-2 mb-4">
                                    <Users size={18} className="text-primary"/> Origem e Identidade
                                  </h5>

                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Nome da Mãe</label>
                                    {isEditingThis ? (
                                      <input type="text" value={editForm.nome_mae || ''} onChange={e => setEditForm({...editForm, nome_mae: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none" />
                                    ) : <p className="text-sm font-medium text-gray-900">{paciente.nome_mae || 'Não informado'}</p>}
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1">Nome Social</label>
                                    {isEditingThis ? (
                                      <input type="text" value={editForm.nome_social || ''} onChange={e => setEditForm({...editForm, nome_social: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none" />
                                    ) : <p className="text-sm font-medium text-gray-900">{paciente.nome_social || '-'}</p>}
                                  </div>

                                  <div className="flex gap-4">
                                    <div className="w-1/2">
                                      <label className="text-xs font-semibold text-gray-500 block mb-1">Gênero</label>
                                      {isEditingThis ? (
                                        <input type="text" value={editForm.identidade_genero || ''} onChange={e => setEditForm({...editForm, identidade_genero: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none" />
                                      ) : <p className="text-sm font-medium text-gray-900 capitalize">{paciente.identidade_genero?.replace('_', ' ') || '-'}</p>}
                                    </div>
                                    <div className="w-1/2">
                                      <label className="text-xs font-semibold text-gray-500 block mb-1">Nacionalidade</label>
                                      {isEditingThis ? (
                                        <input type="text" value={editForm.nacionalidade || ''} onChange={e => setEditForm({...editForm, nacionalidade: e.target.value})} className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none" />
                                      ) : <p className="text-sm font-medium text-gray-900">{paciente.nacionalidade || '-'}</p>}
                                    </div>
                                  </div>
                                </div>

                                {/* BLOCO 3: ENDEREÇO E ATRIBUIÇÃO */}
                                <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative flex flex-col justify-between">
                                  <div>
                                    <h5 className="font-bold text-textBase flex items-center gap-2 mb-4">
                                      <MapPin size={18} className="text-primary"/> Localização
                                    </h5>
                                    <div>
                                      <label className="text-xs font-semibold text-gray-500 block mb-1">Endereço Completo</label>
                                      {isEditingThis ? (
                                        <div className="space-y-2">
                                          <div className="flex gap-2">
                                            <input type="text" value={editForm.logradouro || ''} onChange={e => setEditForm({...editForm, logradouro: e.target.value})} className="w-2/3 text-sm p-2 border border-gray-300 rounded-lg outline-none" placeholder="Rua" />
                                            <input type="text" value={editForm.numero || ''} onChange={e => setEditForm({...editForm, numero: e.target.value})} className="w-1/3 text-sm p-2 border border-gray-300 rounded-lg outline-none" placeholder="Nº" />
                                          </div>
                                          <div className="flex gap-2">
                                            <input type="text" value={editForm.bairro || ''} onChange={e => setEditForm({...editForm, bairro: e.target.value})} className="w-1/2 text-sm p-2 border border-gray-300 rounded-lg outline-none" placeholder="Bairro" />
                                            <input type="text" value={editForm.cidade || ''} onChange={e => setEditForm({...editForm, cidade: e.target.value})} className="w-1/2 text-sm p-2 border border-gray-300 rounded-lg outline-none" placeholder="Cidade" />
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm font-medium text-gray-900 leading-snug">
                                          {paciente.logradouro}, {paciente.numero || 'S/N'}. {paciente.bairro} - {paciente.cidade}/{paciente.uf}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* NOVO: SELECT PARA MUDAR O PROFISSIONAL DESTE AGENDAMENTO */}
                                  <div className={`mt-4 pt-4 border-t border-gray-100 ${isEditingThis ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <label className="text-xs font-bold text-primary block mb-2 uppercase tracking-wide">
                                      Profissional / Local de Atendimento
                                    </label>
                                    <select 
                                      value={ag.profissional || ""} 
                                      onChange={(e) => alterarProfissionalConsulta(ag.id, e.target.value)}
                                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer"
                                    >
                                      <option value="" disabled>Selecione um profissional...</option>
                                      {LISTA_PROFISSIONAIS.map(prof => (
                                        <option key={prof} value={prof}>{prof}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                </div>
                              </div>
                              
                              {/* BOTÕES DE AÇÃO INFERIORES */}
                              <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between border-t border-gray-200/50 pt-6">
                                
                                <div className={`flex flex-wrap gap-3 ${isEditingThis ? 'opacity-30 pointer-events-none' : ''}`}>
                                  {ag.status !== 'cancelado' && (
                                    <button onClick={() => alterarStatusConsulta(ag.id, 'cancelado')} className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
                                      Cancelar Consulta
                                    </button>
                                  )}
                                  {ag.status === 'pendente' && (
                                    <button onClick={() => alterarStatusConsulta(ag.id, 'confirmado')} className="px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5">
                                      Confirmar Atendimento
                                    </button>
                                  )}
                                </div>

                                {isEditingThis && (
                                  <div className="flex gap-3 bg-blue-50 p-2 rounded-xl">
                                    <button onClick={cancelarEdicao} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
                                      <X size={16} /> Descartar
                                    </button>
                                    <button onClick={salvarEdicao} disabled={savingEdit} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50">
                                      {savingEdit ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                                      Salvar Dados
                                    </button>
                                  </div>
                                )}
                                
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
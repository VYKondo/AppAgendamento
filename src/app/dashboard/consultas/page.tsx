'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  CalendarDays, Clock, 
  Search, Loader2, ChevronDown, ChevronUp, 
  Phone, CreditCard, Activity, MapPin, CheckCircle2, Users,
  User as UserIcon
} from 'lucide-react'

// Tipagem exata da sua tabela profiles
type Profile = {
  user_id: string
  email: string
  nome_completo: string
  cpf: string
  cns: string
  data_nascimento: string
  nacionalidade: string
  identidade_genero: string
  orientacao_sexual: string
  mae_nao_declarada: boolean
  nome_mae: string
  pai_nao_declarado: boolean
  nome_pai: string
  telefone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

type Agendamento = {
  id: string
  user_id: string
  nome_paciente: string 
  cpf: string           
  data_agendamento: string
  horario_agendamento: string
  especialidade: string
  modalidade: string
  status: string
  profiles?: Profile // Relação emulada no frontend
}

export default function ConsultasPage() {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState('paciente') // 'paciente', 'medico', 'admin'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    verificarAcessoEBuscarDados()
  }, [])

  const verificarAcessoEBuscarDados = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // 1. Verifica o cargo na tabela user_role (usando o nome no singular conforme seu JSON)
      const { data: roleData } = await supabase
        .from('user_role')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const role = roleData?.role || 'paciente'
      setUserRole(role)

      // 2. Busca os agendamentos baseados no cargo
      let query = supabase
        .from('agendamentos')
        .select('*')
        .order('data_agendamento', { ascending: true })
        .order('horario_agendamento', { ascending: true })

      // Se for paciente comum, filtra para mostrar SÓ os dele
      if (role !== 'admin' && role !== 'medico') {
        query = query.eq('user_id', user.id)
      }

      const { data: agendamentosData, error } = await query

      if (error) throw error
      
      if (!agendamentosData || agendamentosData.length === 0) {
        setAgendamentos([])
        return
      }

      // 3. Busca os perfis manualmente (Resolve o erro PGRST200)
      const userIds = [...new Set(agendamentosData.map(a => a.user_id))]

      const { data: perfisData, error: perfisError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)

      if (perfisError) throw perfisError

      // 4. Une os Agendamentos com os Perfis
      const agendamentosCompletos = agendamentosData.map(ag => {
        const perfilDoPaciente = perfisData?.find(p => p.user_id === ag.user_id)
        return {
          ...ag,
          profiles: perfilDoPaciente
        }
      })

      setAgendamentos(agendamentosCompletos)
    } catch (error) {
      console.error("Erro ao carregar consultas:", error)
    } finally {
      setLoading(false)
    }
  }

  // Funções Utilitárias
  const formatarData = (data?: string) => {
    if (!data) return ''
    return data.split('-').reverse().join('/')
  }
  const formatarHora = (hora?: string) => {
    if (!hora) return ''
    return hora.substring(0, 5)
  }
  const getIniciais = (nome: string) => {
    if (!nome) return '?'
    const partes = nome.trim().split(' ')
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  }

  // Lógica de Filtro da Busca
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const nome = ag.profiles?.nome_completo || ag.nome_paciente || ''
    const cpf = ag.profiles?.cpf || ag.cpf || ''
    const busca = searchTerm.toLowerCase()
    return nome.toLowerCase().includes(busca) || cpf.includes(busca)
  })

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const isAdminOrMedico = userRole === 'admin' || userRole === 'medico'

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-gray-500 font-medium animate-pulse">Carregando consultas...</p>
    </div>
  )

  return (
    <section className="animate-fade-in pb-10">
      {/* CABEÇALHO DINÂMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-textBase mb-1 flex items-center gap-3">
            {isAdminOrMedico ? <Activity className="text-primary" /> : <UserIcon className="text-primary" />}
            {isAdminOrMedico ? 'Agenda de Consultas' : 'Minhas Consultas'}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {isAdminOrMedico 
              ? 'Visualize e gerencie os agendamentos e dados dos pacientes.'
              : 'Acompanhe o histórico e status dos seus agendamentos.'}
          </p>
        </div>
        
        {/* BARRA DE BUSCA - Útil principalmente para médicos/admins */}
        {isAdminOrMedico && (
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
            />
          </div>
        )}
      </div>

      {/* TABELA DE PACIENTES */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-xs font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">{isAdminOrMedico ? 'Paciente' : 'Meus Dados'}</th>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              
              {agendamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              ) : (
                agendamentosFiltrados.map((ag) => {
                  const isExpanded = expandedRow === ag.id
                  const nome = ag.profiles?.nome_completo || ag.nome_paciente || 'Paciente Não Identificado'
                  const cpf = ag.profiles?.cpf || ag.cpf || 'Sem CPF'
                  
                  return (
                    <Fragment key={ag.id}>
                      {/* LINHA PRINCIPAL */}
                      <tr 
                        onClick={() => toggleRow(ag.id)}
                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
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
                              {formatarHora(ag.horario_agendamento)} {ag.modalidade ? `(${ag.modalidade})` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                            ag.status === 'pendente' 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>
                            {ag.status === 'confirmado' && <CheckCircle2 size={14} />}
                            {ag.status === 'pendente' && <Clock size={14} />}
                            <span className="capitalize">{ag.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm transition-colors">
                            {isExpanded ? 'Recolher' : 'Ver Detalhes'}
                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                        </td>
                      </tr>

                      {/* LINHA EXPANSÍVEL (DADOS DO PERFIL COMPLETOS) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-gray-50/50 border-b-2 border-primary/20 p-0 whitespace-normal">
                            <div className="px-6 py-6 animate-fade-in">
                              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                                Ficha Cadastral do Paciente
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                {/* Pessoais */}
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                  <h5 className="font-semibold text-textBase flex items-center gap-2 mb-3">
                                    <CreditCard size={16} className="text-primary"/> Dados Pessoais
                                  </h5>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Data Nasc.</span> {ag.profiles?.data_nascimento ? formatarData(ag.profiles.data_nascimento) : '-'}</p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">CNS</span> {ag.profiles?.cns || '-'}</p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Nacionalidade</span> {ag.profiles?.nacionalidade || '-'}</p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Identidade de Gênero</span> {ag.profiles?.identidade_genero || '-'}</p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Orientação Sexual</span> {ag.profiles?.orientacao_sexual || '-'}</p>
                                </div>

                                {/* Filiação */}
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                  <h5 className="font-semibold text-textBase flex items-center gap-2 mb-3">
                                    <Users size={16} className="text-primary"/> Filiação
                                  </h5>
                                  <p className="text-sm">
                                    <span className="text-gray-500 block text-xs">Nome da Mãe</span> 
                                    {ag.profiles?.mae_nao_declarada ? 'Não Declarada' : (ag.profiles?.nome_mae || '-')}
                                  </p>
                                  <p className="text-sm">
                                    <span className="text-gray-500 block text-xs">Nome do Pai</span> 
                                    {ag.profiles?.pai_nao_declarado ? 'Não Declarado' : (ag.profiles?.nome_pai || '-')}
                                  </p>
                                </div>

                                {/* Contato */}
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                  <h5 className="font-semibold text-textBase flex items-center gap-2 mb-3">
                                    <Phone size={16} className="text-primary"/> Contato
                                  </h5>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Email</span> {ag.profiles?.email || '-'}</p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Telefone</span> {ag.profiles?.telefone || '-'}</p>
                                </div>

                                {/* Endereço */}
                                <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                  <h5 className="font-semibold text-textBase flex items-center gap-2 mb-3">
                                    <MapPin size={16} className="text-primary"/> Endereço
                                  </h5>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">CEP</span> {ag.profiles?.cep || '-'}</p>
                                  <p className="text-sm">
                                    <span className="text-gray-500 block text-xs">Logradouro</span> 
                                    {ag.profiles?.logradouro ? `${ag.profiles.logradouro}, ${ag.profiles.numero || 'S/N'} ${ag.profiles.complemento ? `(${ag.profiles.complemento})` : ''}` : '-'}
                                  </p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Bairro</span> {ag.profiles?.bairro || '-'}</p>
                                  <p className="text-sm"><span className="text-gray-500 block text-xs">Cidade/UF</span> {ag.profiles?.cidade ? `${ag.profiles.cidade} - ${ag.profiles.uf}` : '-'}</p>
                                </div>

                              </div>
                              
                              {/* Botões de Ação - Visíveis apenas para Médicos/Admins */}
                              {isAdminOrMedico && (
                                <div className="mt-6 flex gap-3 justify-end">
                                  <button className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    Cancelar Consulta
                                  </button>
                                  <button className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md transition-colors">
                                    Confirmar Atendimento
                                  </button>
                                </div>
                              )}
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
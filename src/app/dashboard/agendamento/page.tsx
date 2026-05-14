'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAgendamento } from '@/hooks/useAgendamento'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEY_PATIENT_TOKEN, STORAGE_KEY_AGENDAMENTOS } from '@/lib/storage'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { sanitizeString, sanitizeNumeric, validateCPF, validateCNS } from '@/utils/security'
import dynamic from 'next/dynamic'

// Components - Carregados dinamicamente para performance
const PatientIdentification = dynamic(() => import('@/components/agendamento/PatientIdentification'), { ssr: false })
const PatientForm = dynamic(() => import('@/components/agendamento/PatientForm'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-2xl" />
})
const ProfessionalSelection = dynamic(() => import('@/components/agendamento/ProfessionalSelection'), { ssr: false })
const Calendar = dynamic(() => import('@/components/agendamento/Calendar'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-2xl" />
})

export default function AgendamentoPage() {
  const router = useRouter()
  const { formData, setFormData, loading, setLoading, toast, showToast } = useAgendamento()

  // State
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [cpf, setCpf] = useState('')
  const [statusPaciente, setStatusPaciente] = useState<'pendente' | 'novo' | 'existente'>('pendente')
  const [verificandoCpf, setVerificandoCpf] = useState(false)
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('')
  const [loadingCep, setLoadingCep] = useState(false)

  // Form Data
  const [patientData, setPatientData] = useState({
    nomeCompleto: '',
    nomeSocial: '',
    cns: '',
    dataNascimento: '',
    nacionalidade: '',
    identidadeGenero: '',
    orientacaoSexual: '',
    nomeMae: '',
    motherNotDeclared: false,
    nomePai: '',
    fatherNotDeclared: false,
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  })

  const handlePatientDataChange = (field: string, value: string | boolean) => {
    setPatientData(prev => ({ ...prev, [field]: value }))
  }

  const [ultimoCheck, setUltimoCheck] = useState(0)

  const handleVerificarCpf = async () => {
    const agora = Date.now()
    if (agora - ultimoCheck < 2000) {
      showToast('Aguarde um momento antes de tentar novamente.', 'warning')
      return
    }
    setUltimoCheck(agora)

    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      showToast('Por favor, digite um CPF válido com 11 números.', 'warning')
      return
    }
    setVerificandoCpf(true)
    
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('nome_completo, telefone')
        .eq('cpf', cpfLimpo)
        .single()

      if (data) {
        const nomeCompleto = data.nome_completo || ''
        const partes = nomeCompleto.split(' ')
        const nomeMascarado = partes.length > 1 
          ? `${partes[0]} ${partes[1][0]}.***` 
          : partes[0]

        setPatientData(prev => ({ ...prev, nomeCompleto: nomeMascarado }))
        setStatusPaciente('existente')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setStatusPaciente('novo')
        showToast('CPF não encontrado. Por favor, preencha a ficha do paciente.', 'info')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error: unknown) {
      const pgError = error as { code?: string }
      if (pgError.code === 'PGRST116') {
        setStatusPaciente('novo')
        showToast('CPF não encontrado. Por favor, preencha a ficha do paciente.', 'info')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        showToast('Erro de conexão ao verificar o CPF.', 'error')
      }
    } finally {
      setVerificandoCpf(false)
    }
  }

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length > 5) valor = valor.replace(/^(\d{5})(\d)/, '$1-$2')
    handlePatientDataChange('cep', valor)
    
    const clean = valor.replace(/\D/g, '')
    if (clean.length === 8) {
      setLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setPatientData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }))
        }
      } catch { /* silently fail */ }
      finally { setLoadingCep(false) }
    }
  }

  const handleAvancar = async () => {
    if (statusPaciente === 'pendente') {
      showToast('Por favor, identifique-se com o seu CPF primeiro.', 'warning'); return
    }

    const cpfLimpo = sanitizeNumeric(cpf)
    if (!validateCPF(cpfLimpo)) {
      showToast('O CPF informado é inválido.', 'error'); return
    }

    if (!profissionalSelecionado) {
      showToast('Por favor, selecione o profissional e município de atendimento.', 'warning'); return
    }
    if (!formData.dia || !formData.horario) {
      showToast('Selecione uma data e um horário no calendário para continuar.', 'warning'); return
    }
    
    if (statusPaciente === 'novo') {
      const required = ['nomeCompleto', 'dataNascimento', 'cns', 'telefone', 'rua', 'numero', 'bairro', 'cidade', 'uf']
      const missing = required.filter(f => !patientData[f as keyof typeof patientData])
      
      if (missing.length > 0) {
        showToast('Preencha todos os campos obrigatórios (*) marcados.', 'warning'); return
      }

      if (!validateCNS(patientData.cns)) {
        showToast('O Cartão Nacional de Saúde (CNS) deve ter 15 dígitos.', 'error'); return
      }
    }

    setLoading(true)
    try {
      if (statusPaciente === 'novo') {
        const { error: ep } = await supabase.from('pacientes').insert([{
          cpf: cpfLimpo,
          nome_completo: sanitizeString(patientData.nomeCompleto),
          nome_social: sanitizeString(patientData.nomeSocial),
          cns: sanitizeNumeric(patientData.cns),
          data_nascimento: patientData.dataNascimento,
          telefone: sanitizeNumeric(patientData.telefone),
          identidade_genero: sanitizeString(patientData.identidadeGenero),
          orientacao_sexual: sanitizeString(patientData.orientacaoSexual),
          nacionalidade: sanitizeString(patientData.nacionalidade),
          nome_mae: patientData.motherNotDeclared ? 'Não declarado' : sanitizeString(patientData.nomeMae),
          nome_pai: patientData.fatherNotDeclared ? 'Não declarado' : sanitizeString(patientData.nomePai),
          cep: sanitizeNumeric(patientData.cep),
          logradouro: sanitizeString(patientData.rua),
          numero: sanitizeString(patientData.numero),
          complemento: sanitizeString(patientData.complemento),
          bairro: sanitizeString(patientData.bairro),
          cidade: sanitizeString(patientData.cidade),
          uf: sanitizeString(patientData.uf).toUpperCase(),
        }])
        if (ep) throw ep
      }

      const { error: ea } = await supabase.from('agendamentos').insert([{
        paciente_cpf: cpfLimpo,
        data_agendamento: formData.dia,
        horario_agendamento: `${formData.horario}:00`,
        profissional: profissionalSelecionado,
        status: 'agendado',
      }])

      if (ea) {
        if ((ea as { code: string }).code === '23505') {
          showToast('Este horário acabou de ser reservado por outro paciente. Por favor, escolha outro.', 'warning')
          return
        }
        throw ea
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        localStorage.setItem(STORAGE_KEY_PATIENT_TOKEN, cpfLimpo)
        const raw = localStorage.getItem(`${STORAGE_KEY_AGENDAMENTOS}_${cpfLimpo}`)
        const lista = raw ? JSON.parse(raw) : []
        lista.push({
          data_agendamento: formData.dia,
          horario_agendamento: `${formData.horario}:00`,
          status: 'agendado',
          profissional: profissionalSelecionado,
        })
        localStorage.setItem(`${STORAGE_KEY_AGENDAMENTOS}_${cpfLimpo}`, JSON.stringify(lista))
      }

      setProtocolo(`#AGD-${Math.floor(Math.random() * 9000) + 1000}`)
      setMostrarConfirmacao(true)
    } catch (error) {
      showToast('Ocorreu um erro ao salvar o agendamento. Tente novamente.', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetarFormulario = () => {
    setStatusPaciente('pendente')
    setCpf('')
    setPatientData({
      nomeCompleto: '', nomeSocial: '', cns: '', dataNascimento: '', nacionalidade: '',
      identidadeGenero: '', orientacaoSexual: '', nomeMae: '', motherNotDeclared: false,
      nomePai: '', fatherNotDeclared: false, telefone: '', cep: '', rua: '',
      numero: '', complemento: '', bairro: '', cidade: '', uf: ''
    })
    setProfissionalSelecionado('')
    setFormData({ dia: '', horario: '' })
  }

  const handleFecharConfirmacaoEVoltar = () => {
    setMostrarConfirmacao(false)
    resetarFormulario()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const professionals = [
    { nome: 'Adriana', municipio: 'Ribeirão', iniciais: 'AD' },
    { nome: 'Gleiciane', municipio: 'Grandes Rios', iniciais: 'GL' },
    { nome: 'Carlos', municipio: 'Flórida', iniciais: 'CA' }
  ]

  const passo = mostrarConfirmacao ? 3 : statusPaciente !== 'pendente' ? 2 : 1
  const dataFormatada = formData.dia ? formData.dia.split('-').reverse().join('/') : ''

  return (
    <>
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-sm font-medium ${
            toast.type === 'error'   ? 'bg-red-50/95 border-red-200 text-red-800' :
            toast.type === 'success' ? 'bg-green-50/95 border-green-200 text-green-800' :
            'bg-amber-50/95 border-amber-200 text-amber-800'
          }`}>
            <p>{toast.message}</p>
          </div>
        </div>
      )}

      <section className="animate-fade-in print:hidden">
        <div className="mb-8">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors text-gray-400 hover:text-pink-600 group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar ao início
          </button>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-textBase tracking-tight mb-1">Novo Agendamento</h1>
          <p className="text-gray-500 text-sm">Identifique-se e escolha o melhor horário para você.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-0 mb-8">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                n < passo ? 'bg-pink-400 text-white' : n === passo ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-400'
              }`}>
                {n < passo ? <Check size={12} strokeWidth={3} /> : n}
              </div>
              {i < 2 && <div className={`h-px mx-3 w-8 sm:w-14 transition-all duration-500 ${n < passo ? 'bg-pink-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3 space-y-5">
            <PatientIdentification 
              status={statusPaciente}
              cpf={cpf}
              nomeCompleto={patientData.nomeCompleto}
              verificando={verificandoCpf}
              onCpfChange={setCpf}
              onVerify={handleVerificarCpf}
              onReset={resetarFormulario}
            />

            {statusPaciente === 'novo' && (
              <PatientForm 
                data={patientData}
                loadingCep={loadingCep}
                onChange={handlePatientDataChange}
                onCepChange={handleCepChange}
              />
            )}

            {statusPaciente !== 'pendente' && (
              <>
                <ProfessionalSelection 
                  lista={professionals}
                  selecionado={profissionalSelecionado}
                  loading={false}
                  onSelect={setProfissionalSelecionado}
                />
                <Calendar 
                  profissionalSelecionado={profissionalSelecionado}
                  diaSelecionado={formData.dia}
                  horarioSelecionado={formData.horario}
                  onSelectDia={(d) => setFormData({ ...formData, dia: d, horario: '' })}
                  onSelectHorario={(h) => setFormData({ ...formData, horario: h })}
                  showToast={showToast}
                />
              </>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleAvancar}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold font-heading text-white transition-all duration-200 disabled:opacity-60 bg-pink-600 hover:bg-pink-800 shadow-lg shadow-pink-200"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <>Finalizar Agendamento <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>

          <aside className="w-full lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-5 sticky top-28 transition-all hover:shadow-md">
               <h3 className="font-heading font-bold text-sm mb-4 pb-4 border-b border-gray-100">Resumo da Consulta</h3>
               <div className="space-y-3">
                 {[
                   { label: 'Paciente', value: patientData.nomeCompleto || cpf },
                   { label: 'Local', value: profissionalSelecionado },
                   { label: 'Data', value: dataFormatada },
                   { label: 'Horário', value: formData.horario }
                 ].map(item => (
                   <div key={item.label} className="flex justify-between text-xs">
                     <span className="text-gray-400">{item.label}</span>
                     <span className="font-semibold text-gray-800">{item.value || '—'}</span>
                   </div>
                 ))}
               </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Confirmation Modal */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center shrink-0">
                  <Check size={26} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-pink-800">Agendamento Confirmado!</h3>
                  <p className="text-sm text-pink-600">Sua consulta foi registrada. Protocolo: <span className="font-mono font-bold">{protocolo}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Paciente</p>
                  <p className="font-heading font-bold text-gray-800">{patientData.nomeCompleto}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Data e Hora</p>
                  <p className="font-heading font-bold text-gray-800">{dataFormatada} às {formData.horario}</p>
                </div>
              </div>
              <button
                onClick={handleFecharConfirmacaoEVoltar}
                className="w-full py-4 rounded-xl bg-pink-600 text-white font-bold font-heading hover:bg-pink-800 transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

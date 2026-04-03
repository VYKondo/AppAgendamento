'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAgendamentoStore } from '@/store/useAgendamentoStore'
import { supabase } from '@/lib/supabase'
import { Check, CalendarCheck, Home, Printer, User, MapPin } from 'lucide-react'

export default function ConfirmacaoPage() {
  const router = useRouter()
  const { formData, setFormData } = useAgendamentoStore()
  
  // Estado para buscar os dados do usuário para o recibo
  const [perfil, setPerfil] = useState<{ nome: string, cpf: string } | null>(null)

  useEffect(() => {
    // Redireciona de volta se o usuário cair aqui de paraquedas sem dados na store
    if (!formData.dia || !formData.horario) {
      router.push('/dashboard/agendamento')
      return
    }

    // Busca os dados do paciente logado para compor o recibo
    const buscarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('nome_completo, cpf')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setPerfil({ nome: data.nome_completo, cpf: data.cpf })
        }
      }
    }
    buscarPerfil()
  }, [formData, router])

  // Formata a data de YYYY-MM-DD para DD/MM/YYYY
  const dataFormatada = formData.dia ? formData.dia.split('-').reverse().join('/') : ''

  const handleFinalizar = () => {
    // Limpa a store e volta para a home/dashboard
    setFormData({ dia: '', horario: '', nome: '', cpf: '' })
    router.push('/dashboard')
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <section className="animate-fade-in max-w-3xl mx-auto py-8">
      
      {/* Banner de Sucesso */}
      <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-2xl flex items-center gap-4 mb-8 shadow-sm">
        <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0 shadow-md">
          <Check size={28} strokeWidth={3} />
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg">Agendamento Confirmado!</h3>
          <p className="text-sm opacity-90">Sua consulta foi registrada com sucesso em nosso sistema.</p>
        </div>
      </div>

      {/* Comprovante */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative print:shadow-none print:border-gray-300">
        <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400 w-full print:hidden"></div>
        
        <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 pb-8 border-b border-gray-100 gap-4">
            <div>
              <h2 className="font-heading font-bold text-3xl text-textBase mb-1">Comprovante</h2>
              <p className="text-sm text-gray-500">Guarde este documento para o dia da consulta</p>
            </div>
            <div className="sm:text-right bg-gray-50 p-3 rounded-lg border border-gray-100 print:border-none">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Protocolo</span>
              <p className="font-mono text-sm text-gray-700 font-semibold">
                #AGD-{Math.floor(Math.random() * 9000) + 1000}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary mb-2">
                <User size={18} />
                <h4 className="text-xs font-bold text-gray-400 uppercase">Paciente</h4>
              </div>
              <p className="font-semibold text-textBase text-lg">
                {perfil ? perfil.nome : 'Carregando...'}
              </p>
              <p className="text-gray-500 text-sm">
                CPF: {perfil ? perfil.cpf : 'Carregando...'}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary mb-2">
                <MapPin size={18} />
                <h4 className="text-xs font-bold text-gray-400 uppercase">Local</h4>
              </div>
              <p className="font-semibold text-textBase text-lg">Unidade Central de Saúde</p>
              <p className="text-gray-500 text-sm">Apresente-se na recepção com 15 minutos de antecedência.</p>
            </div>
          </div>

          <div className="bg-green-50/50 border border-green-100 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-center text-center sm:text-left print:bg-white print:border-gray-200">
            <div className="bg-white p-4 rounded-full shadow-sm text-green-600 print:border print:border-gray-200">
              <CalendarCheck size={32} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Data e Horário Reservados</p>
              <h3 className="font-heading font-bold text-2xl text-green-700">
                {dataFormatada} às {formData.horario}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Ações (Escondidas na hora de imprimir) */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
        <button 
          onClick={handleImprimir}
          className="bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 hover:text-primary transition-colors py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm"
        >
          <Printer size={18} /> Imprimir Comprovante
        </button>
        <button 
          onClick={handleFinalizar}
          className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30 font-bold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Home size={18} /> Voltar ao Painel
        </button>
      </div>

    </section>
  )
}
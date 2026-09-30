import { Stethoscope, Loader2, Check } from 'lucide-react'
import { C } from '@/styles/palette'
import { Profissional } from '@/hooks/useAgendamento'

interface ProfessionalSelectionProps {
  lista: Profissional[]
  selecionado: string
  loading: boolean
  onSelect: (nome: string) => void
}

export default function ProfessionalSelection({
  lista,
  selecionado,
  loading,
  onSelect
}: ProfessionalSelectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 animate-in slide-in-from-bottom-3 fade-in duration-400 transition-all hover:shadow-md">
      <h2 className="font-heading font-bold text-base mb-1 flex items-center gap-2" style={{ color: C.gray800 }}>
        <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
          <Stethoscope size={16} style={{ color: C.pink600 }} />
        </span>
        Local de Atendimento
      </h2>
      <p className="text-xs mb-5 ml-9" style={{ color: C.gray400 }}>
        Selecione a unidade ou o profissional desejado.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Carregando profissionais...</span>
        </div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-gray-200">
          <Stethoscope size={28} className="mb-2 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Nenhum profissional disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {lista.map(prof => {
            const nomeCompleto = prof.municipio
              ? `${prof.nome} (${prof.municipio})`
              : prof.nome
            const selected = selecionado === nomeCompleto
            return (
              <button
                key={nomeCompleto}
                onClick={() => onSelect(nomeCompleto)}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                  selected ? 'border-pink-400 bg-pink-50 ring-2 ring-pink-200' : 'border-gray-200 bg-white'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-heading shrink-0 ${
                    selected ? 'bg-pink-400 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {prof.iniciais}
                </div>
                <div>
                  <p className={`text-sm font-semibold font-heading ${selected ? 'text-pink-800' : 'text-gray-800'}`}>
                    {prof.nome}
                  </p>
                  {prof.municipio && (
                    <p className={`text-xs ${selected ? 'text-pink-600' : 'text-gray-400'}`}>
                      {prof.municipio}
                    </p>
                  )}
                </div>
                {selected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">
                    <Check size={10} strokeWidth={3} /> Selecionado
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

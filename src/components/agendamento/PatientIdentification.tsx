import { UserCircle, User, Loader2, CheckCircle2, ArrowLeft, Info } from 'lucide-react'
import { C } from '@/styles/palette'

interface PatientIdentificationProps {
  status: 'pendente' | 'novo' | 'existente'
  cpf: string
  nomeCompleto: string
  verificando: boolean
  onCpfChange: (v: string) => void
  onVerify: () => void
  onReset: () => void
}

export default function PatientIdentification({
  status,
  cpf,
  nomeCompleto,
  verificando,
  onCpfChange,
  onVerify,
  onReset
}: PatientIdentificationProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 transition-all hover:shadow-md">
      <h2 className="font-heading font-bold text-base mb-5 flex items-center gap-2" style={{ color: C.gray800 }}>
        <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
          <UserCircle size={16} style={{ color: C.pink600 }} />
        </span>
        Identificação do Paciente
      </h2>

      {status === 'pendente' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide text-gray-600">
              CPF do paciente
            </label>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                <input
                  type="text" placeholder="000.000.000-00" maxLength={14} value={cpf}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, '')
                    if (v.length > 11) v = v.substring(0, 11)
                    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
                    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
                    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2')
                    onCpfChange(v)
                  }}
                  onKeyDown={e => e.key === 'Enter' && onVerify()}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-base outline-none transition-all focus:border-pink-400 focus:ring-4 focus:ring-pink-50"
                />
              </div>
              <button
                onClick={onVerify}
                disabled={cpf.replace(/\D/g, '').length < 11 || verificando}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white font-heading transition-all disabled:opacity-50 bg-pink-600 hover:bg-pink-800"
              >
                {verificando ? <Loader2 size={15} className="animate-spin" /> : 'Verificar'}
              </button>
            </div>
            <p className="text-xs mt-2 text-gray-400">
              Utilizamos o CPF para consultar ou criar o seu cadastro no sistema.
            </p>
          </div>
        </div>
      )}

      {status === 'existente' && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-pink-100 bg-pink-50">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-pink-600" />
            <div>
              <p className="text-sm font-semibold text-pink-800">Cadastro encontrado</p>
              <p className="text-sm text-pink-600">
                Paciente: <strong>{nomeCompleto}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors text-gray-400 hover:text-pink-600"
          >
            <ArrowLeft size={12} /> Trocar CPF
          </button>
        </div>
      )}

      {status === 'novo' && (
        <div className="space-y-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
            <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Primeira consulta</p>
              <p className="text-sm text-blue-700">CPF não encontrado. Preencha a ficha abaixo para criar o cadastro.</p>
            </div>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors text-gray-400 hover:text-pink-600"
          >
            <ArrowLeft size={12} /> Trocar CPF
          </button>
        </div>
      )}
    </div>
  )
}

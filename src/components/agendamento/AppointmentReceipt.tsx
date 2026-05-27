import { Ribbon, MapPin, Calendar, Clock, User, FileText, CheckCircle2 } from 'lucide-react'
import { C } from '@/styles/palette'

interface AppointmentReceiptProps {
  protocolo: string
  pacienteNome: string
  pacienteCpf: string
  unidade: string
  data: string
  horario: string
}

export default function AppointmentReceipt({
  protocolo,
  pacienteNome,
  pacienteCpf,
  unidade,
  data,
  horario
}: AppointmentReceiptProps) {
  // Mascarar CPF para o comprovante (ex: ***.456.***-89)
  const formatarCpfSeguro = (cpf: string) => {
    const clean = cpf.replace(/\D/g, '')
    if (clean.length !== 11) return cpf
    return `***.${clean.substring(3, 6)}.***-${clean.substring(9)}`
  }

  return (
    <div className="bg-white p-8 border-2 border-dashed border-gray-200 rounded-3xl max-w-xl mx-auto my-4 print:border-none print:p-0 print:m-0 print:shadow-none shadow-sm">
      {/* Cabeçalho do Comprovante */}
      <div className="flex flex-col items-center text-center mb-8 pb-6 border-b border-gray-100">
        <div className="bg-pink-600 p-3 rounded-2xl mb-4 print:bg-transparent print:p-0">
          <Ribbon className="text-white w-8 h-8 print:text-pink-600" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-gray-800 uppercase tracking-tight">Comprovante de Agendamento</h2>
        <p className="text-pink-600 font-bold font-mono mt-1 text-lg">{protocolo}</p>
        <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">Portal da Saúde — Prevenção Câncer de Mama</p>
      </div>

      {/* Conteúdo Central */}
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <User size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Paciente</p>
            <p className="font-bold text-gray-800 text-lg leading-tight">{pacienteNome}</p>
            <p className="text-sm text-gray-500 font-medium">CPF: {formatarCpfSeguro(pacienteCpf)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Calendar size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Data</p>
              <p className="font-bold text-gray-800">{data}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Horário</p>
              <p className="font-bold text-gray-800">{horario}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
            <MapPin size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Local / Unidade</p>
            <p className="font-bold text-gray-800">{unidade}</p>
          </div>
        </div>
      </div>

      {/* Rodapé / Instruções */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <div className="bg-sky-50 p-4 rounded-2xl flex gap-3 items-start print:bg-white print:border print:border-gray-100">
          <CheckCircle2 size={18} className="text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-800 leading-relaxed">
            <p className="font-bold mb-1">Informações Importantes:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Chegue com pelo menos 15 minutos de antecedência.</li>
              <li>Leve este comprovante (impresso ou digital) e um documento oficial com foto.</li>
              <li>Em caso de imprevisto, ligue para o telefone da unidade.</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[9px] text-gray-300 uppercase font-bold tracking-[0.2em]">Autenticação Digital</p>
          <div className="mt-2 font-mono text-[10px] text-gray-300 break-all opacity-50">
            {btoa(`${protocolo}-${pacienteCpf}-${data}`).substring(0, 32)}
          </div>
        </div>
      </div>
    </div>
  )
}

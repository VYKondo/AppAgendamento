import { CalendarDays, Clock, Stethoscope, CheckCircle2 } from 'lucide-react'

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const map: Record<string, { bg: string; color: string; icon: React.ReactNode; label: string }> = {
    agendado:       { bg: '#F4F4F5', color: '#52525B', icon: <CalendarDays size={11} />,  label: 'Agendado' },
    aguardando:     { bg: '#FFFBEB', color: '#D97706', icon: <Clock size={11} />,         label: 'Na Sala de Espera' },
    em_atendimento: { bg: '#EFF6FF', color: '#2563EB', icon: <Stethoscope size={11} />,   label: 'Em Atendimento' },
    finalizado:     { bg: '#ECFDF5', color: '#166534', icon: <CheckCircle2 size={11} />,  label: 'Finalizado' },
  }
  const s = map[status] ?? map['agendado']
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm border"
      style={{ background: s.bg, color: s.color, borderColor: `${s.color}30` }}>
      {s.icon} {s.label}
    </span>
  )
}

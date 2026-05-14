import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Meus Agendamentos",
  description: "Consulte e acompanhe o status dos seus agendamentos de exames preventivos.",
}

export default function MeuAgendamentoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

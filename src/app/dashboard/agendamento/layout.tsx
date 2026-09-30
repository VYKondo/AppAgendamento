import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Novo Agendamento",
  description: "Realize seu agendamento online para rastreio preventivo. Rápido, seguro e gratuito.",
}

export default function AgendamentoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

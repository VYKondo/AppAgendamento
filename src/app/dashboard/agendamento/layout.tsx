import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Novo Agendamento",
<<<<<<< HEAD
  description: "Realize seu agendamento online para rastreio preventivo. Rápido, seguro e gratuito.",
=======
  description: "Realize seu agendamento online para mamografia e exames de rastreio preventivo. Rápido, seguro e gratuito.",
>>>>>>> a046bd66e0b63460a576469a6134bfee79a6dbe3
}

export default function AgendamentoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

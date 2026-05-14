import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Portal do Médico",
  description: "Área restrita para profissionais de saúde e administração da Fatec Biomedicina.",
  robots: {
    index: false,
    follow: true,
  }
}

export default function MedicoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

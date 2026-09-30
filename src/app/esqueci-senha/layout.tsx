import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Esqueci minha senha",
  description: "Recupere o acesso ao Portal do Médico da Fatec Biomedicina.",
  robots: {
    index: false,
    follow: false,
  }
}

export default function EsqueciSenhaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

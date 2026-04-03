import { redirect } from 'next/navigation'

export default function Home() {
  // Redireciona o usuário direto para o nosso painel assim que ele entrar no site
  redirect('/dashboard')
}
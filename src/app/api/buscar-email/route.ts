import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usamos a chave SERVICE_ROLE para ignorar as regras do RLS e olhar o banco livremente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { cpf } = await request.json()
    
    // Limpamos a formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '')

    // 1. Busca o user_id na tabela profiles
    const { data: perfil, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('cpf', cleanCpf)
      .single()

    if (dbError || !perfil) {
      return NextResponse.json({ error: 'CPF não encontrado no sistema.' }, { status: 404 })
    }

    // 2. Pega o e-mail real oculto na tabela de autenticação
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(perfil.user_id)

    if (authError || !authData.user || !authData.user.email) {
      return NextResponse.json({ error: 'E-mail de acesso não encontrado.' }, { status: 404 })
    }

    // 3. Devolvemos apenas o e-mail para o front-end fazer o login
    return NextResponse.json({ email: authData.user.email }, { status: 200 })

  } catch (error) {
    console.error('Erro na API de busca de e-mail:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor.' }, 
      { status: 500 }
    )
  }
}
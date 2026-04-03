import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cpf, dataNascimento, cns } = body

    // Limpamos pontuações que vêm do front-end
    const cleanCpf = cpf.replace(/\D/g, '')
    const cleanCns = cns.replace(/\D/g, '')
    console.log("==== DADOS RECEBIDOS ====")
    console.log("CPF original:", cpf)
    console.log("CPF limpo (o que vai pro banco):", cleanCpf)
    console.log("Tamanho do CPF limpo:", cleanCpf.length, "dígitos")
    console.log("=========================")

    // 1. Buscamos pelo CPF, puxando o USER_ID (a chave real de autenticação)
    const { data: paciente, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, cns, data_nascimento') // <-- Usando user_id
      .eq('cpf', cleanCpf)
      .single()

    if (dbError || !paciente) {
      console.error("Erro na busca do perfil:", dbError)
      return NextResponse.json({ error: 'CPF não encontrado em nossos registros.' }, { status: 404 })
    }

    // 2. Validação do CNS
    const dbCns = paciente.cns ? paciente.cns.replace(/\D/g, '') : ''
    if (dbCns !== cleanCns) {
      return NextResponse.json({ error: 'O Cartão SUS (CNS) informado não confere com este CPF.' }, { status: 400 })
    }

    // 3. Validação da Data de Nascimento (seu banco salva como 'YYYY-MM-DD', o que é ótimo!)
    const dbDataNascimento = paciente.data_nascimento ? paciente.data_nascimento.split('T')[0] : ''
    if (dbDataNascimento !== dataNascimento) {
      return NextResponse.json({ error: 'A Data de Nascimento informada está incorreta.' }, { status: 400 })
    }
    
    // 4. Aqui estava o erro! Pegamos o e-mail passando o paciente.user_id
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(paciente.user_id)
    
    if (authError || !authData.user || !authData.user.email) {
        console.error("Erro ao buscar usuário no Auth:", authError)
        return NextResponse.json({ error: 'Conta de autenticação não encontrada para este perfil.' }, { status: 404 })
    }

    const originUrl = request.headers.get('origin') || 'http://localhost:3000'

    // 5. Geramos o link de recuperação dizendo para onde ir depois
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: authData.user.email,
        options: {
            redirectTo: `${originUrl}/atualizar-senha` // <-- A MÁGICA ESTÁ AQUI
        }
    });
    if (linkError) throw linkError;

    return NextResponse.json({ 
        message: 'Identidade confirmada', 
        recoveryLink: linkData.properties.action_link 
    }, { status: 200 })

  } catch (error) {
    console.error('Erro na API de recuperação:', error)
    return NextResponse.json(
        { error: 'Erro interno no servidor ao processar a solicitação.' }, 
        { status: 500 }
    )
  }
}
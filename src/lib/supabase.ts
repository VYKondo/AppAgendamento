import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Verificação de segurança para o desenvolvedor
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Atenção: As chaves do Supabase não foram encontradas. " +
    "Verifique se o arquivo .env.local existe na raiz do projeto."
  )
}

// Exportamos um ÚNICO cliente otimizado para o navegador.
// O createBrowserClient é o que conversa com o seu Middleware.
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)
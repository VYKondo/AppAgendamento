import { C } from '@/styles/palette'

interface AvatarProps {
  nome: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ nome, size = 'md' }: AvatarProps) {
  const iniciais = (() => {
    if (!nome) return '?'
    const p = nome.trim().split(' ')
    return p.length === 1 ? p[0].substring(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
  })()
  const dim = size === 'sm' ? 'w-8 h-8 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-9 h-9 text-xs'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-inner border`}
      style={{ background: C.pink50, color: C.pink600, borderColor: C.pink100 }}>
      {iniciais}
    </div>
  )
}

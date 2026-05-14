import { C } from '@/styles/palette'

interface ReadFieldProps {
  label: string
  value?: string | null
  mono?: boolean
  icon?: React.ReactNode
}

export default function ReadField({ label, value, mono, icon }: ReadFieldProps) {
  return (
    <div className="px-3.5 py-2.5 rounded-xl border flex flex-col justify-center h-full" 
         style={{ background: C.gray50, borderColor: C.gray100 }}>
      <p className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5 text-gray-400">{label}</p>
      <div className={`flex items-start gap-1.5 text-sm font-semibold leading-snug ${mono ? 'font-mono tracking-tight text-xs mt-0.5' : ''}`} 
         style={{ color: value ? C.gray800 : C.gray400 }}>
        {icon && <span className="mt-[2px] text-pink-400">{icon}</span>}
        <span className="break-words w-full">{value || 'Não informado'}</span>
      </div>
    </div>
  )
}

import { C } from '@/styles/palette'

interface EditInputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
}

export default function EditInput({ label, value, onChange, placeholder, type = 'text', className = '' }: EditInputProps) {
  return (
    <div className="w-full flex flex-col justify-end">
      {label && <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 text-gray-400">{label}</p>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full text-sm font-medium px-3.5 py-2.5 rounded-xl outline-none border shadow-sm transition-all focus:border-pink-400 focus:ring-4 focus:ring-pink-50 ${className}`}
        style={{ backgroundColor: '#fff', borderColor: C.gray200, color: C.gray800 }}
      />
    </div>
  )
}

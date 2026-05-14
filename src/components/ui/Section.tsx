import { C } from '@/styles/palette'

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}

export default function Section({ icon, title, children }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3.5">
        <div className="p-1.5 rounded-lg bg-pink-50">
          <span className="text-pink-500">{icon}</span>
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500">{title}</p>
      </div>
      {children}
    </div>
  )
}

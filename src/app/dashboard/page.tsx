import Link from 'next/link'
import { Info, ShieldPlus, ArrowRight, PlayCircle, Check, Activity, Network, Microscope, HeartHandshake } from 'lucide-react'

export default function DashboardHome() {
  return (
    <section className="animate-fade-in">
      
      <div className="animate-slide-up bg-blue-50 border-l-4 border-info text-blue-800 p-4 rounded-r-lg shadow-sm mb-10 flex gap-3 items-start">
        <Info className="text-info w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong className="font-heading text-sm block">Campanha Outubro Rosa Prorrogada</strong>
          <span className="text-sm">Agendamentos para mamografia estão abertos para mulheres acima de 40 anos.</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="w-full lg:w-1/2 space-y-6">
          <span className="inline-flex items-center gap-1 py-1 px-3 rounded-full bg-secondary/20 text-primary font-semibold text-sm tracking-wide">
            <ShieldPlus size={16} /> Saúde Pública
          </span>
          <h1 className="font-heading font-extrabold text-5xl md:text-6xl leading-tight text-textBase">
            Câncer de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Mama</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
            Informações, prevenção e cuidados especializados. Um portal integrado para facilitar seu acesso à saúde com agilidade e humanização.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link href="/dashboard/agendamento" className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-1 transition-all duration-300 font-semibold py-3.5 px-8 rounded-xl flex items-center gap-2">
              Agendar Consulta <ArrowRight size={18} />
            </Link>
            <button className="bg-white border border-gray-200 text-textBase hover:border-secondary hover:text-primary shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 font-semibold py-3.5 px-8 rounded-xl flex items-center gap-2">
              <PlayCircle size={18} className="text-primary" /> Como funciona
            </button>
          </div>
        </div>
        
        <div className="relative bg-white p-4 rounded-3xl shadow-soft border border-gray-100 z-10 w-full max-w-sm mx-auto">
          <div className="bg-gradient-to-br from-secondary/20 to-primary/10 rounded-2xl w-full aspect-square flex items-center justify-center relative overflow-hidden border border-white">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl"></div>

            <svg className="w-32 h-32 text-primary drop-shadow-xl transform hover:scale-105 transition-transform duration-500 z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              <path d="M15 9h-2V7h-2v2H9v2h2v2h2v-2h2V9z" fill="#FFF"/>
            </svg>
            
            <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white flex items-center gap-3 animate-slide-up hover:-translate-y-1 transition-transform cursor-default z-20" style={{ animationDelay: '0.5s' }}>
              <div className="bg-success/20 text-success rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                <Check size={16} strokeWidth={3} />
              </div>
              <div className="text-xs font-bold text-gray-700 leading-tight">
                Médicos<br/><span className="text-primary">Especialistas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl mb-4">O que é o câncer de mama?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">O câncer de mama é um tipo de tumor maligno que surge nas células da mama. É essencial realizar exames de rotina para detecção precoce.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <article className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:border-secondary hover:shadow-hover transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <Activity size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Tumor Maligno</h3>
            <p className="text-sm text-gray-500">Formação de nódulos na região da mama, precisando de avaliação médica.</p>
          </article>
          <article className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:border-secondary hover:shadow-hover transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <Network size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Riscos de Metástase</h3>
            <p className="text-sm text-gray-500">Se não tratado, pode se espalhar para outros órgãos do corpo.</p>
          </article>
          <article className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:border-secondary hover:shadow-hover transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <Microscope size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Exames de Rotina</h3>
            <p className="text-sm text-gray-500">Detectável através de mamografias regulares e autoexame mensal.</p>
          </article>
          <article className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100 hover:border-secondary hover:shadow-hover transform hover:-translate-y-2 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <HeartHandshake size={24} />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Altas Chances</h3>
            <p className="text-sm text-gray-500">O diagnóstico precoce eleva as chances de cura em até 95%.</p>
          </article>
        </div>
      </div>
    </section>
  )
}
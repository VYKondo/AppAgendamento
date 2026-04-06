import Link from 'next/link'
import {
  Info, ShieldPlus, ArrowRight, PlayCircle, Check,
  Activity, Network, Microscope, HeartHandshake,
  CalendarCheck, Phone, ChevronRight, Ribbon
} from 'lucide-react'

// ── Paleta (idêntica ao restante do sistema) ─────────────────
const C = {
  pink50:  '#FDF0F7',
  pink100: '#F9D0E9',
  pink200: '#F3A1D0',
  pink400: '#E84393',
  pink600: '#C73280',
  pink800: '#8B1F57',
  gray50:  '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#18181B',
}

const INFO_CARDS = [
  {
    icon: Activity,
    title: 'Tumor Maligno',
    body: 'Formação de nódulos na região da mama que precisam de avaliação médica especializada.',
    accent: C.pink600,
    bg: C.pink50,
  },
  {
    icon: Network,
    title: 'Risco de Metástase',
    body: 'Se não tratado, o tumor pode se espalhar para linfonodos e outros órgãos do corpo.',
    accent: '#B45309',
    bg: '#FFFBEB',
  },
  {
    icon: Microscope,
    title: 'Exames de Rotina',
    body: 'Detectável por mamografia e autoexame. O rastreio regular salva vidas todos os dias.',
    accent: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    icon: HeartHandshake,
    title: 'Altas Chances de Cura',
    body: 'O diagnóstico precoce eleva as chances de cura em até 95%, com tratamento adequado.',
    accent: '#15803D',
    bg: '#F0FDF4',
  },
]

const STATS = [
  { value: '95%',   label: 'de chance de cura',   sub: 'com diagnóstico precoce'  },
  { value: '1 em 8', label: 'mulheres afetadas',  sub: 'ao longo da vida'          },
  { value: '40+',   label: 'anos — faça mamografia', sub: 'exame anual recomendado' },
]

const STEPS = [
  { n: '01', title: 'Agende online',         body: 'Escolha data, horário e profissional sem sair de casa.' },
  { n: '02', title: 'Compareça à consulta',  body: 'Dirija-se à unidade no horário confirmado com seu protocolo.' },
  { n: '03', title: 'Receba o diagnóstico',  body: 'Resultado com encaminhamento e orientações detalhadas.' },
]

export default function DashboardHome() {
  return (
    <section className="animate-fade-in space-y-20 pb-12">

      {/* ══ BANNER ══ */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-2xl text-sm font-medium"
        style={{ background: C.pink50, border: `1px solid ${C.pink100}`, color: C.pink800 }}
      >
        <Ribbon size={16} className="shrink-0 mt-0.5" style={{ color: C.pink600 }} />
        <div>
          <strong className="font-heading block mb-0.5">Campanha Outubro Rosa Prorrogada</strong>
          <span style={{ color: C.pink600, fontWeight: 400 }}>
            Agendamentos para mamografia abertos para mulheres acima de 40 anos.{' '}
            <Link href="/dashboard/agendamento" className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity">
              Agende agora →
            </Link>
          </span>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div className="relative">
        {/* Fundo decorativo */}
        <div
          className="absolute inset-0 -mx-6 md:-mx-12 rounded-3xl -z-10 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${C.pink50} 0%, #fff 60%)` }}
        >
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30"
            style={{ background: C.pink100 }} />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-20"
            style={{ background: C.pink200 }} />
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-12 px-2">

          {/* Texto */}
          <div className="w-full lg:w-1/2 space-y-6">
            <span
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{ background: C.pink100, color: C.pink800 }}
            >
              <ShieldPlus size={13} /> Saúde Pública
            </span>

            <h1 className="font-heading font-extrabold text-5xl md:text-6xl leading-tight" style={{ color: C.gray800 }}>
              Cuidar de você{' '}
              <br className="hidden md:block" />
              <span style={{ color: C.pink600 }}>é a nossa missão.</span>
            </h1>

            <p className="text-base leading-relaxed max-w-lg" style={{ color: C.gray500 }}>
              Portal integrado de saúde para prevenção, diagnóstico e acompanhamento do câncer de mama — com agilidade e humanização para cada paciente.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard/agendamento"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white font-heading transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: C.pink600, boxShadow: `0 4px 24px ${C.pink200}` }}
              >
                Agendar Consulta <ArrowRight size={16} />
              </Link>
              <button
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold border font-heading transition-all duration-200 hover:border-pink-300 hover:-translate-y-0.5"
                style={{ borderColor: C.gray200, color: C.gray600, background: '#fff' }}
              >
                <PlayCircle size={16} style={{ color: C.pink400 }} /> Como funciona
              </button>
            </div>

            {/* Mini-stats inline */}
            <div className="flex flex-wrap gap-6 pt-2 border-t" style={{ borderColor: C.gray100 }}>
              {STATS.map(s => (
                <div key={s.label} className="pt-4">
                  <p className="font-heading font-extrabold text-2xl" style={{ color: C.pink600 }}>{s.value}</p>
                  <p className="text-xs font-medium" style={{ color: C.gray400 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card visual */}
          <div className="relative w-full max-w-xs mx-auto lg:mx-0 shrink-0">
            <div className="bg-white rounded-3xl border p-5"
              style={{ borderColor: C.pink100, boxShadow: `0 8px 48px ${C.pink200}60` }}>

              {/* Área visual */}
              <div className="rounded-2xl mb-4 overflow-hidden relative"
                style={{ background: `linear-gradient(135deg, ${C.pink50}, ${C.pink100})`, aspectRatio: '1 / 1' }}>

                {/* Ícone central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-28 h-28 drop-shadow-lg" fill={C.pink600} viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    <path d="M15 9h-2V7h-2v2H9v2h2v2h2v-2h2V9z" fill="#fff" />
                  </svg>
                </div>

                {/* Chip — consulta */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md flex items-center gap-2"
                  style={{ border: `1px solid ${C.pink100}` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: C.pink100 }}>
                    <CalendarCheck size={14} style={{ color: C.pink800 }} />
                  </div>
                  <div className="text-xs leading-tight">
                    <p className="font-bold" style={{ color: C.gray800 }}>Próxima consulta</p>
                    <p style={{ color: C.pink600 }}>Cheque os horários</p>
                  </div>
                </div>

                {/* Chip — especialistas */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md flex items-center gap-2"
                  style={{ border: `1px solid ${C.pink100}` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: '#F0FDF4' }}>
                    <Check size={14} strokeWidth={3} style={{ color: '#15803D' }} />
                  </div>
                  <div className="text-xs leading-tight">
                    <p className="font-bold" style={{ color: C.gray800 }}>Especialistas</p>
                    <p style={{ color: '#15803D' }}>3 municípios</p>
                  </div>
                </div>
              </div>

              {/* CTA dentro do card */}
              <Link
                href="/dashboard/agendamento"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: C.pink600 }}
              >
                <span>Agendar agora</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>

   
      {/* ══ SOBRE O CÂNCER DE MAMA ══ */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: C.pink400 }}>
              Entenda a doença
            </p>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl" style={{ color: C.gray800 }}>
              O que é o câncer de mama?
            </h2>
          </div>
          <p className="text-sm max-w-sm text-right hidden sm:block" style={{ color: C.gray400 }}>
            Tumor maligno que surge nas células da mama. O rastreio precoce é o maior aliado da cura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {INFO_CARDS.map(({ icon: Icon, title, body, accent, bg }) => (
            <article
              key={title}
              className="bg-white rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-200 cursor-default hover:-translate-y-1"
              style={{ borderColor: C.gray100 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon size={22} style={{ color: accent }} />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-bold text-base mb-1.5" style={{ color: C.gray800 }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.gray500 }}>{body}</p>
              </div>
              <div
                className="h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-full"
                style={{ background: accent, opacity: 0.4 }}
              />
            </article>
          ))}
        </div>
      </div>

      {/* ══ COMO FUNCIONA ══ */}
      <div
        className="relative rounded-3xl overflow-hidden px-8 py-12 md:px-14"
        style={{ background: `linear-gradient(135deg, ${C.pink800} 0%, ${C.pink600} 100%)` }}
      >
        {/* Decoração */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
          style={{ background: '#fff' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 translate-y-1/2 -translate-x-1/2"
          style={{ background: '#fff' }} />

        <div className="relative z-10">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: C.pink200 }}>
            Processo simples
          </p>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-white mb-10">
            Como funciona?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-heading font-extrabold text-sm"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                  >
                    {s.n}
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block flex-1 h-px border-t border-dashed"
                      style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                  )}
                </div>
                <h3 className="font-heading font-bold text-lg text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.pink200 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/dashboard/agendamento"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white border transition-all hover:bg-white/20 font-heading"
              style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)' }}
            >
              Iniciar agendamento <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ══ RODAPÉ INFORMATIVO ══ */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl border"
        style={{ background: C.gray50, borderColor: C.gray200 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.pink100 }}>
            <Info size={16} style={{ color: C.pink600 }} />
          </div>
          <p className="text-sm" style={{ color: C.gray600 }}>
            Este portal é um serviço público. Todas as consultas são{' '}
            <strong className="font-semibold" style={{ color: C.gray800 }}>gratuitas</strong> e integradas ao SUS.
          </p>
        </div>
        <Link
          href="/dashboard/agendamento"
          className="inline-flex items-center gap-1.5 text-sm font-bold whitespace-nowrap shrink-0 transition-opacity hover:opacity-70"
          style={{ color: C.pink600 }}
        >
          Agendar consulta <ChevronRight size={15} />
        </Link>
      </div>

    </section>
  )
}
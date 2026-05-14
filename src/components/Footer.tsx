import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto w-full" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Rodapé</h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">

          {/* Informações da Esquerda */}
          <div className="flex flex-col items-center md:items-start space-y-2 text-center md:text-left">
            <h3 className="font-heading font-bold text-primary text-xl tracking-tight">
              Fatec Biomedicina
            </h3>
            <p className="text-gray-500 text-sm md:max-w-md leading-relaxed">
              Iniciativa conjunta para o rastreio preventivo e combate ao câncer de mama em parceria com o Governo Municipal.
            </p>
            <p className="text-[11px] text-gray-400 font-medium pt-2">
              © {currentYear} — Todos os direitos reservados.
            </p>
          </div>

          {/* Logo da Prefeitura na Direita */}
          <div className="flex items-center gap-4 group transition-all">
            <div className="w-14 h-16 relative flex-shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500">
              <Image 
                src="/brasao-grandes-rios.png" 
                alt="Brasão de Grandes Rios" 
                fill
                className="object-contain"
                sizes="56px"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-extrabold text-gray-800 leading-none text-xl tracking-tighter">
                GRANDES RIOS
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1.5 font-bold">
                Governo Municipal
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
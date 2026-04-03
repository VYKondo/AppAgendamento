import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          
          {/* Informações da Esquerda */}
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-primary text-lg">
              Fatec Biomedicina
            </h3>
            <p className="text-gray-500 text-sm md:max-w-md">
              Uma colaboração da Fatec - Biomedicina com a Prefeitura de Grandes Rios.
            </p>
          </div>

          {/* Logo da Prefeitura na Direita */}
          <div className="flex items-center justify-center gap-3">
            {/* IMPORTANTE: Salve a imagem do brasão na pasta "public" do seu projeto 
              com o nome "brasao-grandes-rios.png" 
            */}
            <div className="w-12 h-14 relative flex-shrink-0">
              <Image 
                src="/brasao-grandes-rios.png" 
                alt="Brasão da Cidade de Grandes Rios" 
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-bold text-textBase leading-none text-lg">
                GRANDES RIOS
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-widest mt-1 font-medium">
                Governo Municipal
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}
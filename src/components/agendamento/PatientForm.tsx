import { FileText, Loader2 } from 'lucide-react'
import { C } from '@/styles/palette'

interface PatientFormProps {
  data: {
    nomeCompleto: string
    nomeSocial: string
    cns: string
    dataNascimento: string
    nacionalidade: string
    identidadeGenero: string
    orientacaoSexual: string
    nomeMae: string
    motherNotDeclared: boolean
    nomePai: string
    fatherNotDeclared: boolean
    telefone: string
    cep: string
    rua: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    uf: string
  }
  loadingCep: boolean
  onChange: (field: string, value: string | boolean) => void
  onCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const formatarTelefone = (value: string) => {
  if (!value) return ''
  value = value.replace(/\D/g, '')
  value = value.replace(/^(\d{2})(\d)/g, '($1) $2')
  value = value.replace(/(\d{5})(\d)/, '$1-$2')
  return value.substring(0, 15)
}

export default function PatientForm({
  data,
  loadingCep,
  onChange,
  onCepChange
}: PatientFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-500 transition-all hover:shadow-md">
      <h2 className="font-heading font-bold text-base mb-5 flex items-center gap-2" style={{ color: C.gray800 }}>
        <span className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.pink50 }}>
          <FileText size={16} style={{ color: C.pink600 }} />
        </span>
        Dados Pessoais
      </h2>

      <p className="text-xs font-bold tracking-widest uppercase mb-3 text-gray-400">Informações básicas</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="md:col-span-2">
          <label htmlFor="nomeCompleto" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">
            Nome completo <span className="text-pink-600" aria-hidden="true">*</span>
          </label>
          <input 
            id="nomeCompleto"
            type="text" required value={data.nomeCompleto} onChange={e => onChange('nomeCompleto', e.target.value)}
            placeholder="Nome conforme documento"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div>
          <label htmlFor="nomeSocial" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">Nome Social</label>
          <input 
            id="nomeSocial"
            type="text" value={data.nomeSocial} onChange={e => onChange('nomeSocial', e.target.value)}
            placeholder="Como prefere ser chamado"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div>
          <label htmlFor="dataNascimento" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">
            Data de nasc. <span className="text-pink-600" aria-hidden="true">*</span>
          </label>
          <input 
            id="dataNascimento"
            type="date" required max={new Date().toISOString().split('T')[0]}
            value={data.dataNascimento} onChange={e => onChange('dataNascimento', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div>
          <label htmlFor="nacionalidade" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">Nacionalidade</label>
          <input 
            id="nacionalidade"
            type="text" value={data.nacionalidade} onChange={e => onChange('nacionalidade', e.target.value)}
            placeholder="Ex: Brasileira"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="cns" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">
            CNS — Cartão Nacional de Saúde <span className="text-pink-600" aria-hidden="true">*</span>
          </label>
          <input 
            id="cns"
            type="text" required maxLength={15} value={data.cns}
            onChange={e => onChange('cns', e.target.value.replace(/\D/g, ''))}
            placeholder="000 0000 0000 0000"
            className="w-full md:w-1/2 px-4 py-3 border border-gray-200 rounded-xl text-base outline-none font-mono focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all"
          />
        </div>
      </div>

      {/* Identidade e Orientação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label htmlFor="identidadeGenero" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">Identidade de Gênero</label>
          <input 
            id="identidadeGenero"
            type="text" value={data.identidadeGenero} onChange={e => onChange('identidadeGenero', e.target.value)}
            placeholder="Ex: Mulher Cis, Homem Trans..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div>
          <label htmlFor="orientacaoSexual" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">Orientação Sexual</label>
          <input 
            id="orientacaoSexual"
            type="text" value={data.orientacaoSexual} onChange={e => onChange('orientacaoSexual', e.target.value)}
            placeholder="Ex: Heterossexual, Lésbica..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
      </div>

      <p className="text-xs font-bold tracking-widest uppercase mb-3 text-gray-400">Filiação</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="nomeMae" className="text-xs font-bold text-gray-600 uppercase tracking-tight">Nome da Mãe</label>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 cursor-pointer uppercase">
              <input type="checkbox" checked={data.motherNotDeclared}
                onChange={e => onChange('motherNotDeclared', e.target.checked)}
                className="rounded text-pink-600 focus:ring-pink-500"
              />
              Não declarado
            </label>
          </div>
          <input 
            id="nomeMae"
            type="text" disabled={data.motherNotDeclared}
            value={data.motherNotDeclared ? '' : data.nomeMae}
            onChange={e => onChange('nomeMae', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none disabled:bg-gray-50 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="nomePai" className="text-xs font-bold text-gray-600 uppercase tracking-tight">Nome do Pai</label>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 cursor-pointer uppercase">
              <input type="checkbox" checked={data.fatherNotDeclared}
                onChange={e => onChange('fatherNotDeclared', e.target.checked)}
                className="rounded text-pink-600 focus:ring-pink-500"
              />
              Não declarado
            </label>
          </div>
          <input 
            id="nomePai"
            type="text" disabled={data.fatherNotDeclared}
            value={data.fatherNotDeclared ? '' : data.nomePai}
            onChange={e => onChange('nomePai', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none disabled:bg-gray-50 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 mb-5" />

      <p className="text-xs font-bold tracking-widest uppercase mb-3 text-gray-400">Contato e endereço</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="telefone" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">
            Telefone <span className="text-pink-600" aria-hidden="true">*</span>
          </label>
          <input 
            id="telefone"
            type="tel" required value={data.telefone}
            onChange={e => onChange('telefone', formatarTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div>
          <label htmlFor="cep" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">
            CEP {loadingCep && <Loader2 size={11} className="inline animate-spin ml-1" />}
            <span className="text-pink-600" aria-hidden="true"> *</span>
          </label>
          <input 
            id="cep"
            type="text" required maxLength={9} value={data.cep} onChange={onCepChange}
            placeholder="00000-000"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="rua" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">
            Rua e número <span className="text-pink-600" aria-hidden="true">*</span>
          </label>
          <div className="flex gap-2">
            <input 
              id="rua"
              type="text" required value={data.rua} onChange={e => onChange('rua', e.target.value)}
              placeholder="Logradouro"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
            />
            <label htmlFor="numero" className="sr-only">Número</label>
            <input 
              id="numero"
              type="text" required value={data.numero} onChange={e => onChange('numero', e.target.value)}
              placeholder="Nº"
              className="w-24 px-4 py-3 border border-gray-200 rounded-xl text-base outline-none text-center focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="complemento" className="block text-xs font-bold mb-1.5 text-gray-600 uppercase tracking-tight">Complemento</label>
          <input 
            id="complemento"
            type="text" value={data.complemento} onChange={e => onChange('complemento', e.target.value)}
            placeholder="Apto, Bloco, Casa..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
          />
        </div>
        <div className="md:col-span-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="bairro" className="sr-only">Bairro</label>
              <input 
                id="bairro"
                type="text" required value={data.bairro} onChange={e => onChange('bairro', e.target.value)}
                placeholder="Bairro"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="cidade" className="sr-only">Cidade</label>
              <input 
                id="cidade"
                type="text" required value={data.cidade} onChange={e => onChange('cidade', e.target.value)}
                placeholder="Cidade"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
              />
            </div>
            <div className="w-20">
              <label htmlFor="uf" className="sr-only">UF</label>
              <input 
                id="uf"
                type="text" required value={data.uf}
                onChange={e => onChange('uf', e.target.value.toUpperCase())}
                placeholder="UF"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none text-center uppercase focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

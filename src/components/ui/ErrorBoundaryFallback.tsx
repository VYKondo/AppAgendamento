import { C } from '@/styles/palette'

export default function ErrorBoundaryFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Algo deu errado</h2>
      <p className="text-gray-500 max-w-sm mb-6">
        Não conseguimos carregar esta seção. Isso pode ser um problema temporário de conexão.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
        >
          Recarregar página
        </button>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-pink-200"
          style={{ background: C.pink600 }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

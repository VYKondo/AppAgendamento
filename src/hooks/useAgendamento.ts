import { useState, useEffect, useCallback } from 'react'
import { useAgendamentoStore } from '@/store/useAgendamentoStore'

export type Profissional = {
  nome: string
  municipio: string
  iniciais: string
}

export type EscalaMedica = {
  id: string
  profissional: string
  horarios: string[]
  data: string
}

export function useAgendamento() {
  const { formData, setFormData, authState } = useAgendamentoStore()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'warning' | 'success' | 'info'; id: number } | null>(null)

  const showToast = useCallback((message: string, type: 'error' | 'warning' | 'success' | 'info' = 'warning') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    toast,
    showToast,
    isAuthUser: authState.isAuthenticated
  }
}

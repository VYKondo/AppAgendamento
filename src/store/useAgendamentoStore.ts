import { create } from 'zustand'

type FormData = {
  dia: string
  horario: string
}

interface AuthState {
  isAuthenticated: boolean
  userEmail: string | null
  hasPatientToken: boolean
  isLoading: boolean
}

interface AgendamentoStore {
  formData: FormData
  authState: AuthState
  setFormData: (data: Partial<FormData>) => void
  setAuthState: (state: Partial<AuthState>) => void
  resetForm: () => void
}

export const useAgendamentoStore = create<AgendamentoStore>((set) => ({
  formData: { dia: '', horario: '' },
  authState: {
    isAuthenticated: false,
    userEmail: null,
    hasPatientToken: false,
    isLoading: true
  },
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  setAuthState: (data) => set((state) => ({
    authState: { ...state.authState, ...data }
  })),
  resetForm: () => set({ formData: { dia: '', horario: '' } })
}))

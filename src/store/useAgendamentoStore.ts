import { create } from 'zustand'

type FormData = {
  dia: string
  horario: string
}

interface AgendamentoStore {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  resetForm: () => void
}

export const useAgendamentoStore = create<AgendamentoStore>((set) => ({
  formData: { dia: '', horario: '' },
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  resetForm: () => set({ formData: { dia: '', horario: '' } })
}))

import { create } from 'zustand'

// Definimos o que vamos guardar
type FormData = {
  nome: string;
  cpf: string;
  whatsapp: string;
  email: string;
  tipo: string;
  dia: string;
  horario: string;
}

interface AgendamentoStore {
  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
}

// Criamos a memória global
export const useAgendamentoStore = create<AgendamentoStore>((set) => ({
  formData: {
    nome: '', cpf: '', whatsapp: '', email: '', 
    tipo: 'primeira_vez', dia: '05/10', horario: '10:00'
  },
  // Função para atualizar apenas o campo que a usuária digitou
  setFormData: (data) => set((state) => ({ 
    formData: { ...state.formData, ...data } 
  })),
  // Limpa tudo depois de confirmar
  resetForm: () => set({ 
    formData: { nome: '', cpf: '', whatsapp: '', email: '', tipo: 'primeira_vez', dia: '05/10', horario: '10:00' } 
  })
}))
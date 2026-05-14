/**
 * Utilitários de segurança e sanitização
 */

export const sanitizeString = (val: string): string => {
  return val.trim().replace(/[<>]/g, ''); // Remove tags básicas para evitar XSS simples
};

export const sanitizeNumeric = (val: string): string => {
  return val.replace(/\D/g, '');
};

export const validateCPF = (cpf: string): boolean => {
  const clean = sanitizeNumeric(cpf);
  if (clean.length !== 11) return false;
  
  // Impede CPFs com todos os números iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  return true;
};

export const validateCNS = (cns: string): boolean => {
  const clean = sanitizeNumeric(cns);
  return clean.length === 15;
};

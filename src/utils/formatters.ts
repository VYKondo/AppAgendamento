export const formatarData = (d?: string) => {
  if (!d) return '';
  return d.split('-').reverse().join('/');
};

export const formatarHora = (h?: string) => {
  if (!h) return '';
  return h.substring(0, 5);
};

export const formatarCPF = (c: string) => {
  if (!c) return '';
  const clean = c.replace(/\D/g, '');
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatarTelefone = (value: string) => {
  if (!value) return ''
  const clean = value.replace(/\D/g, '')
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
};

export const RECEPTION_EMAILS = [
  'agendamento.preventivorb@gmail.com',
  'agendamento.preventivofi@gmail.com',
  'agendamento.preventivogr@gmail.com'
] as const;

export const EMAIL_TO_MUNICIPIO: Record<string, string> = {
  'agendamento.preventivofi@gmail.com': 'Flórida',
  'agendamento.preventivorb@gmail.com': 'Ribeirão',
  'agendamento.preventivogr@gmail.com': 'Grandes Rios'
};

export type ReceptionEmail = typeof RECEPTION_EMAILS[number];

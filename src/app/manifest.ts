import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fatec Biomedicina | Rastreio Preventivo',
    short_name: 'Fatec Saúde',
<<<<<<< HEAD
    description: 'Portal de agendamento integrado para o rastreio preventivo.',
=======
    description: 'Portal de agendamento integrado para o rastreio preventivo e combate ao câncer de mama.',
>>>>>>> a046bd66e0b63460a576469a6134bfee79a6dbe3
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#E84393',
    icons: [
      {
        src: '/brasao-grandes-rios.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}

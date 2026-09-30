import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import NextTopLoader from 'nextjs-toploader'; // Adicionado
import StructuredData from "@/components/SEO/StructuredData";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const poppins = Poppins({ 
  weight: ['500', '600', '700', '800'],
  subsets: ["latin"],
  variable: '--font-heading' 
});

export const metadata: Metadata = {
  metadataBase: new URL('https://portaldasaude.vercel.app'),
  title: {
    default: "Fatec Biomedicina | Rastreio Preventivo",
    template: "%s | Fatec Biomedicina"
  },
<<<<<<< HEAD
  description: "Portal de agendamento integrado para o rastreio preventivo em Grandes Rios, Ribeirão e Flórida.",
=======
  description: "Portal de agendamento integrado para o rastreio preventivo e combate ao câncer de mama em Grandes Rios, Ribeirão e Flórida.",
>>>>>>> a046bd66e0b63460a576469a6134bfee79a6dbe3
  keywords: ["Câncer de Mama", "Rastreio Preventivo", "Mamografia", "Saúde Pública", "Fatec Biomedicina", "Grandes Rios", "SUS", "Agendamento Online"],
  authors: [{ name: "Fatec Biomedicina" }],
  creator: "Fatec Biomedicina",
  publisher: "Fatec Biomedicina",
  applicationName: "Fatec Saúde",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Fatec Biomedicina | Rastreio Preventivo",
<<<<<<< HEAD
    description: "Portal integrado para o agendamento de preventivos. Agende seus preventivos online.",
=======
    description: "Portal integrado para o combate ao câncer de mama. Agende sua mamografia e exames preventivos online.",
>>>>>>> a046bd66e0b63460a576469a6134bfee79a6dbe3
    url: 'https://portaldasaude.vercel.app',
    siteName: 'Fatec Saúde',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/brasao-grandes-rios.png',
        width: 800,
        height: 600,
        alt: 'Logo Fatec Biomedicina - Rastreio Preventivo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Fatec Biomedicina | Rastreio Preventivo",
    description: "Agende seu exame preventivo de câncer de mama de forma rápida e segura.",
    images: ['/brasao-grandes-rios.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#E84393",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased bg-background">
        <StructuredData />
        {/* Barra de progresso rosa no topo */}
        <NextTopLoader 
          color="#E84393" 
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          easing="ease"
        />
        {children}
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import NextTopLoader from 'nextjs-toploader'; // Adicionado
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const poppins = Poppins({ 
  weight: ['500', '600', '700', '800'],
  subsets: ["latin"],
  variable: '--font-heading' 
});

export const metadata: Metadata = {
  title: "Câncer de Mama - Portal de Saúde",
  description: "Agendamento de consultas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased bg-background">
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
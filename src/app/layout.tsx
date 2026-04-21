import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "le CabRH — Générateur de Compte Rendu d'Entretien",
  description:
    "Déposez un CV (PDF ou DOCX) et obtenez automatiquement un compte rendu d'entretien structuré, prêt à exporter en Word.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

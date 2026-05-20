import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JORNADA.pt | A máquina do tempo do futebol",
    template: "%s | JORNADA.pt"
  },
  description:
    "Plataforma editorial, cronológica e contextual para consultar futebol por competição, jornada e momento competitivo."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}

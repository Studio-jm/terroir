import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Barre } from "@/app/barre";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Terroir",
  description: "Plateforme petits producteurs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${sourceSans.variable} ${fraunces.variable}`}
    >
      <body>
        <Barre />
        {children}
      </body>
    </html>
  );
}

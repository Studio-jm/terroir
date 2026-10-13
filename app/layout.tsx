import type { Metadata } from "next";
import { Barre } from "@/app/barre";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terroir",
  description: "Plateforme petits producteurs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>
        <Barre />
        {children}
      </body>
    </html>
  );
}

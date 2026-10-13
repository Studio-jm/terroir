import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terroir",
  description: "Plateforme petits producteurs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

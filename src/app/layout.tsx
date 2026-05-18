import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mon Planning",
  description: "Planning de travail personnel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

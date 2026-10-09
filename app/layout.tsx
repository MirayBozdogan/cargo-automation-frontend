import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cargo Automation",
  description: "Cargo Automation",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="tr">
      <body>
      <nav>
        <Link href="/">Giriş Yap</Link>
        <Link href="/register">Kayıt Ol</Link>
        <Link href="/profile">Profilim</Link>
        <Link href="/addresses">Adreslerim</Link>
      </nav>

      {children}
      </body>
      </html>
  );
}
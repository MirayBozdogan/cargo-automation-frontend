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
        <Link href="/">Ana Sayfa</Link>
        <Link href="/customers">Müşteriler</Link>
        <Link href="/addresses">Adresler</Link>
        <Link href="/shipment">Gönderiler</Link>
      </nav>

      {children}
      </body>
      </html>
  );
}
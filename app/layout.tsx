import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import AppShell from "./components/AppShell";
import "./globals.css";

// Fontlar build sırasında indirilip uygulamayla birlikte sunulur; tarayıcı Google'a istek atmaz.
// latin-ext: ğ, ş, ı, İ gibi Türkçe karakterler için.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-jetbrains", display: "swap" });

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
      <html lang="tr" className={`${inter.variable} ${mono.variable}`}>
      <body>
      <AuthProvider>
        <AppShell>{children}</AppShell>
      </AuthProvider>
      </body>
      </html>
  );
}
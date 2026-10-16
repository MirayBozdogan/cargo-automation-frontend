import type { Metadata } from "next";
import { AuthProvider } from "./components/AuthProvider";
import Navigation from "./components/Navigation";
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
      <AuthProvider>
        <Navigation />
        {children}
      </AuthProvider>
      </body>
      </html>
  );
}
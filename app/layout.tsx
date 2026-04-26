import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "Portal Bayaran Desa Tanjung",
  description: "Pengurusan bayaran bulanan untuk komuniti penduduk.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${atkinson.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}

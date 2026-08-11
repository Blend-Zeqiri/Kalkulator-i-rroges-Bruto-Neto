import type { Metadata } from "next";
import { Inter } from "next/font/google";
import calculatorData from "@/data/calculator.json";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: calculatorData.text.metaTitle,
  description: calculatorData.text.metaDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className={inter.variable}>
      <body className={`${inter.className} font-sans`}>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import calculatorData from "@/data/calculator.json";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: calculatorData.metadata.title,
  description: calculatorData.metadata.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={calculatorData.locale}><body className={inter.variable}>{children}</body></html>;
}

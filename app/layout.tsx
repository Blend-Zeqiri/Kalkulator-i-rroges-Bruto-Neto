import type { Metadata } from "next";
import { Inter } from "next/font/google";
import calculatorData from "@/data/calculator.json";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const themeScript = `try{if(localStorage.getItem(${JSON.stringify(calculatorData.theme.storageKey)})==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}`;

export const metadata: Metadata = {
  title: calculatorData.metadata.title,
  description: calculatorData.metadata.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={calculatorData.locale} suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body className={inter.variable}>{children}</body>
  </html>;
}

import type { Metadata } from "next";
import { sans, serifItalic, mono } from "@/design/fonts";
import { LocaleProvider } from "@/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spark",
  description: "Spark — en svensk AI-medgrundare byggd på registerdata.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${sans.variable} ${serifItalic.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

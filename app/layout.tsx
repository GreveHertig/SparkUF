import type { Metadata } from "next";
import { sans, serifItalic } from "@/design/fonts";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import "./globals.css";

// Svenska är sajtens standardspråk och det som delade länkar visar.
// Delningsbilden ligger bredvid som opengraph-image.png/twitter-image.png;
// Next.js gör bildadressen absolut med Vercels produktionsadress.
export const metadata: Metadata = {
  title: sv.meta.title,
  description: sv.meta.description,
  openGraph: {
    title: sv.meta.title,
    description: sv.meta.description,
    siteName: "Spark",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: sv.meta.title,
    description: sv.meta.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sv"
      className={`${sans.variable} ${serifItalic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

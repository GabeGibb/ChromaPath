import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import { SettingsProvider } from "@/services/localStorage/SettingsContext";
import { SoundProvider } from "@/services/sound/SoundContext";

export const metadata: Metadata = {
  title: "ChromaPath",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5157CCHDGT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5157CCHDGT');
          `}
        </Script>
      </head>
      <body className={`antialiased`}>
        <SettingsProvider>
          <SoundProvider>
            <div
              suppressHydrationWarning // ! LOL
              className="flex h-screen flex-col xl:flex-row"
            >
              <Navigation />
              <main className="flex-1 xl:ml-0 overflow-auto">{children}</main>
            </div>
          </SoundProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

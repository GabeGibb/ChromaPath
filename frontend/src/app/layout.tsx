import type { Metadata } from "next";
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
      <body className={`antialiased`}>
        <SettingsProvider>
          <SoundProvider>
            <div className="flex min-h-screen">
              <Navigation />
              <main className="flex-1 xl:ml-0">{children}</main>
            </div>
          </SoundProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}

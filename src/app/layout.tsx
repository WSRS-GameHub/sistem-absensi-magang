import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "sonner";

import "leaflet/dist/leaflet.css";

import { ThemeProvider } from "@/components/providers/theme-provider";

import { AuthProvider } from "@/components/providers/auth-provider";

import { getAuthUser } from "@/lib/auth/get-auth-user";

export const metadata: Metadata = {
  title: "APLIKASI PESERTA MAGANG",
  description:
    "Sistem Absensi & Tugas Peserta Magang",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthUser();

  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider user={user}>
            {children}

            <Toaster
            position="top-right"
            richColors
            closeButton
          />

          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
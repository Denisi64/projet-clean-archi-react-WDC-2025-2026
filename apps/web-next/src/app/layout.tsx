import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { NotificationsListener } from "./components/NotificationsListener";
import { ToastProvider } from "./components/ToastProvider";
import { PersonalNotificationsListener } from "./components/PersonalNotificationsListener";
import { SocketProvider } from "@/providers/SocketProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avenir Bank — Espace client",
  description: "Ouvrez et pilotez vos comptes bancaires en ligne.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>
            <SocketProvider>
              <NotificationsListener />
              <PersonalNotificationsListener />
              {children}
            </SocketProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

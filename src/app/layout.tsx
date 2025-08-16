import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ascend Skills - AI-Powered Placement Platform",
  description: "Crack your dream job with confidence. AI-powered quizzes, mock interviews, analytics & smart preparation—all in one platform. Transform your placement preparation with cutting-edge technology.",
  keywords: "placement platform, job preparation, AI quizzes, mock interviews, career preparation, student placement, interview practice",
  authors: [{ name: "Ascend Skills Team" }],
  creator: "Ascend Skills",
  publisher: "Ascend Skills",
  robots: "index, follow",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/aslogo.png', type: 'image/png', sizes: '32x32' },
      { url: '/aslogo.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/aslogo.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico'
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ascendskills.com",
    title: "Ascend Skills - AI-Powered Placement Platform",
    description: "Crack your dream job with confidence. AI-powered preparation tools for students.",
    siteName: "Ascend Skills",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ascend Skills - AI-Powered Placement Platform",
    description: "Crack your dream job with confidence. AI-powered preparation tools for students.",
    creator: "@ascendskills",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14c0de",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <main>
            {children}
          </main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

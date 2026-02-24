import type { Metadata } from "next"
import { Bricolage_Grotesque, Figtree } from "next/font/google"
import "./globals.css"
import ConvexClientProvider from "@/components/ConvexClientProvider"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap"
})

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap"
})

export const metadata: Metadata = {
  title: "Jobs App - Find jobs you actually want",
  description: "a friendly job marketplace for candidates and companies. Search, apply, and hire with confidence.",
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} ${figtree.variable} antialiased`}
      >
        <ClerkProvider 
          dynamic
          appearance={{
            cssLayerName: "clerk",
            variables: {
              colorPrimary: "var(--terracotta)",
              colorBackground: "var(--background)",
              colorForeground: "var(--foreground)",
              colorPrimaryForeground: "var(--primary-foreground)",
              colorMuted: "var(--muted)",
              colorMutedForeground: "var(--muted-foreground)",
              colorBorder: "var(--border)",
              colorInput: "var(--input)",
              colorInputForeground: "var-(foreground)",
              colorRing: "var(--ring)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-figtree), var(-font-sans), sans-serif"
            }
          }}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster richColors closeButton position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  )
}

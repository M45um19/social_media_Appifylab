import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import QueryProvider from "@/providers/query-provider";

// Load static CSS files from public assets
import "../../public/assets/css/bootstrap.min.css";
import "../../public/assets/css/common.css";
import "../../public/assets/css/main.css";
import "../../public/assets/css/responsive.css";
import "./globals.css";

const poppins = Poppins({
  weight: ["100", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buddy Script - Registration",
  description: "Create an account on Buddy Script",
  icons: {
    icon: "/assets/images/logo-copy.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className={poppins.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

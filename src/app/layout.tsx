import "~/styles/globals.css";

import { type Metadata } from "next";
import { Manrope } from "next/font/google";
import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  title: "Tikr | Historical portfolio lab",
  description:
    "Build hypothetical portfolios with an explicitly labeled local sample-data demo.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable}`}>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

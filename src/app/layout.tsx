import "~/styles/globals.css";
import { DemoPortfoliosProvider } from "~/providers/demo-portfolios-provider";

import { type Metadata } from "next";
import { Manrope } from "next/font/google";
import { ConvexClientProvider } from "./convex-client-provider";

export const metadata: Metadata = {
  title: "Tikr | Historical portfolio lab",
  description:
    "Build hypothetical portfolios with an explicitly labeled local sample-data demo.",
  icons: {
    icon: [{ url: "/brand/bear-aviator.png", type: "image/png" }],
    apple: "/brand/bear-aviator.png",
  },
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
        <ConvexClientProvider>
          <DemoPortfoliosProvider>{children}</DemoPortfoliosProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

import "~/styles/globals.css";
import { DemoPortfoliosProvider } from "~/providers/demo-portfolios-provider";

import { type Metadata } from "next";
import { Manrope } from "next/font/google";

export const metadata: Metadata = {
  title: "Tikr",
  description:
    "Build hypothetical portfolios with an explicitly labeled local sample-data demo.",
  icons: {
    icon: [{ url: "/favicon.ico?v=2", type: "image/x-icon" }],
    apple: "/brand/tikr-icon.png",
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
        <DemoPortfoliosProvider>{children}</DemoPortfoliosProvider>
      </body>
    </html>
  );
}

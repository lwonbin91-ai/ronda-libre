import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ronda Libre – 유소년을 위한 자유로운 경기 문화",
  description: "한국에는 없는 경기량. 코치가 아닌 아이가 결정하는 리그. 시즌 동안 최소 16경기 보장.",
  openGraph: {
    title: "Ronda Libre",
    description: "한국에는 없는 경기량. 코치가 아닌 아이가 결정하는 리그.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className={`${geist.variable} font-sans antialiased bg-gray-950 text-white min-h-screen`}>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

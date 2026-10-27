import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "FPS Advisor - Nền tảng Chẩn đoán & Tối ưu PC Gaming",
  description:
    "Quét phần cứng, đo benchmark, dự đoán FPS chính xác cho Valorant, CS2, LMHT, Delta Force và đưa ra khuyến nghị cải thiện hiệu năng an toàn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#0b0f19] text-gray-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

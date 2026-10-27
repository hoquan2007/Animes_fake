import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Komorebi — Tiệm truyện của bạn",
  description: "Tìm tập truyện tiếp theo cho kệ sách của bạn. Khám phá manga, lưu yêu thích và đặt truyện cùng Komorebi.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head><link rel="stylesheet" href="/fonts/fonts.css"/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

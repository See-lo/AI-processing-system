import type { Metadata } from "next";
import "./globals.css";

const systemFontVariables = {
  variable: "--font-system",
};

export const metadata: Metadata = {
  title: "AI 处理系统",
  description: "基于Next.js 14和智谱AI API构建的多媒体处理系统，支持图片解析、AI生图和AI生视频功能",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${systemFontVariables.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

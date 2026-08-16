import type { Metadata } from "next";
import MotionRoot from "@/components/MotionRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "EarRole · 이어롤",
  description: "잇고, 잘 듣고, 역할을 플레이하는 개인용 스토리 롤플 채팅",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}

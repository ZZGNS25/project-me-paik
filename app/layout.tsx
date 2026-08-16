import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이어롤",
  description: "길게 놀아도 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

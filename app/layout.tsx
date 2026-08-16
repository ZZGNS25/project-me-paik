import type { Metadata, Viewport } from "next";
import MotionRoot from "@/components/MotionRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "EarRole · 이어롤",
  description: "듣고, 잇고, 연기하다. 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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

import type { Metadata, Viewport } from "next";
import MotionRoot from "@/components/MotionRoot";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "이어롤",
    "EarRole",
    "롤플",
    "스토리 채팅",
    "RP",
    "캐릭터",
    "세계관",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/earrole-mark.png",
        alt: `EarRole — ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/earrole-mark.png"],
  },
  icons: {
    icon: "/earrole-mark.png",
    apple: "/earrole-mark.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#07090c",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: "EarRole",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Web",
  inLanguage: "ko-KR",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionRoot>{children}</MotionRoot>
      </body>
    </html>
  );
}

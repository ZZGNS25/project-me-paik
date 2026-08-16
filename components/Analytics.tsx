"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { gaId, trackPageView } from "@/lib/analytics";

function AnalyticsBody() {
  const id = gaId();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!id) return;
    const query = searchParams.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [id, pathname, searchParams]);

  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsBody />
    </Suspense>
  );
}

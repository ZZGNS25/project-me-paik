"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gaId, trackPageView } from "@/lib/analytics";

function AnalyticsBody() {
  const id = gaId();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (!id) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const query = searchParams.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [id, pathname, searchParams]);

  return null;
}

export default function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsBody />
    </Suspense>
  );
}

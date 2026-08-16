import type { Metadata } from "next";
import { loadShare, shareUrl } from "@/lib/share";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

type ShareLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const share = await loadShare(id).catch(() => null);
  const title = share?.title?.trim()
    ? `${share.title} · 이어롤`
    : SITE_TITLE;
  const description =
    share?.snapshot.character.oneLiner.trim() ||
    share?.snapshot.worldSetting.trim().slice(0, 160) ||
    SITE_DESCRIPTION;
  const url = shareUrl(id, SITE_URL);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ShareLayout({ children }: ShareLayoutProps) {
  return children;
}

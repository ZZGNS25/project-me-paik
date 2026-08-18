function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "https://project-me-paik.vercel.app";
}

export const SITE_URL = siteOrigin();
export const SITE_NAME = "이어롤";
export const SITE_TITLE = "EarRole · 이어롤";
export const SITE_MOTTO = "듣고, 잇고, 몰입하다.";
export const SITE_TAGLINE = "귀를 기울이며 이야기를 잇는 텍스트 기반 롤플레이.";
export const SITE_DESCRIPTION = `${SITE_MOTTO} ${SITE_TAGLINE}`;

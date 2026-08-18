import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · EarRole`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#07090c",
    theme_color: "#07090c",
    lang: "ko",
    icons: [
      {
        src: "/earrole-mark.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

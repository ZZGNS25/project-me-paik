import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_MOTTO } from "@/lib/site";

export const alt = `EarRole — ${SITE_MOTTO}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(text: string, weight: number) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.3 Safari/605.1.15",
        },
      },
    ).then((response) => response.text());
    const match = css.match(
      /url\((https:\/\/[^)]+)\) format\('(opentype|truetype)'\)/,
    );
    if (!match?.[1]) return null;
    const font = await fetch(match[1]);
    if (!font.ok) return null;
    return font.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const mark = await readFile(join(process.cwd(), "public", "earrole-mark.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;
  const sample = `EarRole ${SITE_MOTTO}`;
  const [regular, bold] = await Promise.all([
    loadFont(sample, 400),
    loadFont(sample, 700),
  ]);

  const fonts = [
    bold
      ? { name: "Noto Sans KR", data: bold, weight: 700 as const, style: "normal" as const }
      : null,
    regular
      ? { name: "Noto Sans KR", data: regular, weight: 400 as const, style: "normal" as const }
      : null,
  ].filter((font): font is NonNullable<typeof font> => Boolean(font));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0d10",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
          }}
        >
          <img src={markSrc} width={176} height={220} alt="" />
          <div
            style={{
              color: "#f2f4f7",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "0.08em",
              lineHeight: 1,
              fontFamily: fonts.length ? "Noto Sans KR" : "sans-serif",
            }}
          >
            EarRole
          </div>
          <div
            style={{
              color: "#7c8593",
              fontSize: 20,
              letterSpacing: "0.04em",
              lineHeight: 1.4,
              fontFamily: fonts.length ? "Noto Sans KR" : "sans-serif",
            }}
          >
            {SITE_MOTTO}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length > 0 ? { fonts } : {}),
    },
  );
}

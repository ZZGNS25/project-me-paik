import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public", "earrole-mark.png");

const source = sharp(src);
const { width, height } = await source.metadata();
if (!width || !height) throw new Error("Could not read earrole-mark.png");

const sample = await source
  .clone()
  .extract({ left: 0, top: 0, width: 1, height: 1 })
  .raw()
  .toBuffer({ resolveWithObject: true });
const [r, g, b, a = 255] = sample.data;
const background = { r, g, b, alpha: a / 255 };

async function squareIcon(size, outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(src)
    .resize(size, size, { fit: "contain", background, withoutEnlargement: false })
    .png()
    .toFile(outPath);
  console.log(`wrote ${outPath.replace(root + "\\", "")} ${size}x${size} from ${width}x${height}`);
}

await squareIcon(256, join(root, "app", "icon.png"));
await squareIcon(180, join(root, "app", "apple-icon.png"));
await squareIcon(32, join(root, "public", "favicon-32.png"));
await squareIcon(192, join(root, "public", "icon-192.png"));
await squareIcon(512, join(root, "public", "icon-512.png"));

import { readdir, rm } from "node:fs/promises";
import { dirname, extname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(
  root,
  "public",
  "avatars",
  "archive",
  "remastered-sources",
);
const targetDir = join(root, "public", "avatars");
const outputSize = 1536;

const profileFiles = [
  "hunter-seoyunha.png",
  "hunter-me.png",
  "hunter-kangtaemin.png",
  "hunter-hansora.png",
  "hunter-parkjinwoo.png",
  "hunter-leedohyun.png",
  "hunter-kimjaehyuk.png",
  "academy-edel.png",
  "academy-me.png",
  "academy-kael.png",
  "academy-luna.png",
  "academy-marco.png",
  "academy-iris.png",
  "academy-drake.png",
  "reincarnate-serena.png",
  "reincarnate-me.png",
  "reincarnate-roen.png",
  "reincarnate-duke.png",
  "reincarnate-yuria.png",
  "reincarnate-allen.png",
  "reincarnate-mir.png",
];

for (const file of profileFiles) {
  const source = join(sourceDir, file);
  const metadata = await sharp(source).metadata();
  const output = join(targetDir, `${parse(file).name}.webp`);

  await sharp(source)
    .resize(outputSize, outputSize, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.55, m1: 0.7, m2: 1.8 })
    .webp({ quality: 94, alphaQuality: 100, effort: 6 })
    .toFile(output);

  console.log(
    `${file}: ${metadata.width}x${metadata.height} -> ${parse(output).base} ${outputSize}x${outputSize}`,
  );
}

const activeFiles = await readdir(targetDir, { withFileTypes: true });
for (const entry of activeFiles) {
  if (!entry.isFile()) continue;
  const extension = extname(entry.name).toLowerCase();
  if (extension === ".jpg" || extension === ".png") {
    await rm(join(targetDir, entry.name));
  }
}

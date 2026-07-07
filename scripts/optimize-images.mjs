// One-off script to generate optimized responsive derivatives for the
// oversized home-page images. Source "master" files are left untouched;
// this only adds new sibling files at reasonable sizes/formats.
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const jobs = [
  {
    src: "src/assets/images/gallery/index_background.png",
    outDir: "src/assets/images/gallery",
    baseName: "index_background",
    widths: [640, 1024, 1920, 2560],
    fallbackWidth: 1920,
  },
  {
    src: "src/assets/images/gallery/banner-parc-natural.png",
    outDir: "src/assets/images/gallery",
    baseName: "banner-parc-natural",
    widths: [640, 1024, 1920],
    fallbackWidth: 1920,
  },
  {
    src: "src/assets/images/blog/2026/neix-la-ruta-gastronomica/featured.png",
    outDir: "src/assets/images/blog/2026/neix-la-ruta-gastronomica",
    baseName: "featured-optimized",
    widths: [640, 1024, 1536],
    fallbackWidth: 1536,
  },
];

const WEBP_QUALITY = 82;
const JPEG_QUALITY = 82;

function fmtSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function run() {
  for (const job of jobs) {
    const srcStat = fs.statSync(job.src);
    console.log(`\n== ${job.src} (${fmtSize(srcStat.size)}) ==`);

    for (const width of job.widths) {
      const webpPath = path.join(job.outDir, `${job.baseName}-${width}.webp`);
      await sharp(job.src)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);
      const s = fs.statSync(webpPath);
      console.log(`  ${webpPath} -> ${fmtSize(s.size)}`);
    }

    const jpgPath = path.join(job.outDir, `${job.baseName}-${job.fallbackWidth}.jpg`);
    await sharp(job.src)
      .resize({ width: job.fallbackWidth, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(jpgPath);
    const s = fs.statSync(jpgPath);
    console.log(`  ${jpgPath} -> ${fmtSize(s.size)} (fallback)`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

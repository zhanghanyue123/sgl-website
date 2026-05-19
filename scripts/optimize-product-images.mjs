import fs from "fs";
import path from "path";
import sharp from "sharp";

const productFile = path.join(process.cwd(), "data", "products.ts");
const publicDir = path.join(process.cwd(), "public");
const productsDir = path.join(publicDir, "products");
const optimizedDir = path.join(productsDir, "optimized");

if (!fs.existsSync(productFile)) {
  throw new Error("Cannot find data/products.ts");
}

if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

let content = fs.readFileSync(productFile, "utf8");

const localImages = Array.from(
  new Set(content.match(/\/products\/[^"'\s]+/g) || [])
).filter((src) => {
  return (
    !src.includes("/optimized/") &&
    !src.endsWith(".svg") &&
    /\.(jpg|jpeg|png|webp)$/i.test(src)
  );
});

console.log(`Found ${localImages.length} product images to optimize.`);

const replacements = {};

for (let i = 0; i < localImages.length; i++) {
  const src = localImages[i];
  const inputPath = path.join(publicDir, src);
  const baseName = path.basename(src, path.extname(src));
  const outputName = `${baseName}.webp`;
  const outputPath = path.join(optimizedDir, outputName);
  const newSrc = `/products/optimized/${outputName}`;

  if (!fs.existsSync(inputPath)) {
    console.warn(`Missing file: ${src}`);
    continue;
  }

  console.log(`Optimizing ${i + 1}/${localImages.length}: ${src}`);

  await sharp(inputPath)
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      quality: 74,
      effort: 5
    })
    .toFile(outputPath);

  replacements[src] = newSrc;
}

for (const [oldSrc, newSrc] of Object.entries(replacements)) {
  content = content.split(oldSrc).join(newSrc);
}

fs.writeFileSync(productFile, content);

console.log("Done. Updated data/products.ts with optimized WebP image paths.");

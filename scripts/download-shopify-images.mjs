import fs from "fs";
import path from "path";

const productFile = path.join(process.cwd(), "data", "products.ts");
const outputDir = path.join(process.cwd(), "public", "products");

if (!fs.existsSync(productFile)) {
  throw new Error("Cannot find data/products.ts");
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let content = fs.readFileSync(productFile, "utf8");

const urls = Array.from(
  new Set(content.match(/https:\/\/cdn\.shopify\.com\/[^"'\s]+/g) || [])
);

console.log(`Found ${urls.length} Shopify image URLs.`);

const replacements = {};

function getExtension(url) {
  const cleanPath = new URL(url).pathname;
  const ext = path.extname(cleanPath).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
    return ext;
  }

  return ".jpg";
}

for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  const ext = getExtension(url);
  const filename = `sgl-product-${String(i + 1).padStart(3, "0")}${ext}`;
  const outputPath = path.join(outputDir, filename);
  const localPath = `/products/${filename}`;

  console.log(`Downloading ${i + 1}/${urls.length}: ${filename}`);

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`Failed: ${url}`);
    continue;
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

  replacements[url] = localPath;
}

for (const [remoteUrl, localPath] of Object.entries(replacements)) {
  content = content.split(remoteUrl).join(localPath);
}

fs.writeFileSync(productFile, content);

console.log("Done. Updated data/products.ts with local image paths.");
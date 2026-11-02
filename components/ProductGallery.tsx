"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { localeFromPath, type Locale } from "@/lib/i18n";

const galleryCopy: Record<Locale, { image: string; images: string; show: string; thumbnail: string }> = {
  en: { image: "image", images: "Product images", show: "Show", thumbnail: "thumbnail" },
  "zh-CN": { image: "图片", images: "产品图片", show: "显示", thumbnail: "缩略图" },
  "ja-JP": { image: "画像", images: "商品画像", show: "表示", thumbnail: "サムネイル" },
  "ko-KR": { image: "이미지", images: "제품 이미지", show: "보기", thumbnail: "미리보기" },
  "it-IT": { image: "immagine", images: "Immagini del prodotto", show: "Mostra", thumbnail: "miniatura" }
};

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const locale = localeFromPath(usePathname());
  const copy = galleryCopy[locale];
  const [selected, setSelected] = useState(0);
  const photos = images.length ? images : ["/products/placeholder-bag.svg"];
  return (
    <div>
      <div className="relative aspect-square border border-sglInk bg-sglPaper" aria-live="polite">
        <Image src={photos[selected]} alt={`${title} — ${copy.image} ${selected + 1}`} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-4" />
      </div>
      {photos.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3" aria-label={copy.images}>
          {photos.map((src, index) => (
            <button key={`${src}-${index}`} type="button" onClick={() => setSelected(index)} aria-label={`${copy.show} ${title}, ${copy.image} ${index + 1}`} aria-pressed={selected === index} className={`relative aspect-square border bg-sglPaper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selected === index ? "border-sglInk ring-2 ring-sglInk" : "border-sglInk/25 hover:border-sglInk"}`}>
              <Image src={src} alt={`${title}, ${copy.thumbnail} ${index + 1}`} fill sizes="(max-width: 768px) 25vw, 12vw" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

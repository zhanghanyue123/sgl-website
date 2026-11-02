"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { localeFromPath, type Locale } from "@/lib/i18n";

type GalleryCopy = {
  image: string;
  images: string;
  show: string;
  thumbnail: string;
  zoomIn: string;
  zoomOut: string;
};

const galleryCopy: Record<Locale, GalleryCopy> = {
  en: {
    image: "image",
    images: "Product images",
    show: "Show",
    thumbnail: "thumbnail",
    zoomIn: "Click to zoom · Move cursor to inspect",
    zoomOut: "Click again or press Esc to close"
  },
  "zh-CN": {
    image: "图片",
    images: "产品图片",
    show: "显示",
    thumbnail: "缩略图",
    zoomIn: "点击放大 · 移动鼠标查看细节",
    zoomOut: "再次点击或按 Esc 退出"
  },
  "ja-JP": {
    image: "画像",
    images: "商品画像",
    show: "表示",
    thumbnail: "サムネイル",
    zoomIn: "クリックで拡大 · カーソルを動かして確認",
    zoomOut: "もう一度クリックまたは Esc で終了"
  },
  "ko-KR": {
    image: "이미지",
    images: "제품 이미지",
    show: "보기",
    thumbnail: "미리보기",
    zoomIn: "클릭하여 확대 · 마우스를 움직여 상세 보기",
    zoomOut: "다시 클릭하거나 Esc를 눌러 종료"
  },
  "it-IT": {
    image: "immagine",
    images: "Immagini del prodotto",
    show: "Mostra",
    thumbnail: "miniatura",
    zoomIn: "Clicca per ingrandire · Muovi il cursore per esplorare",
    zoomOut: "Clicca di nuovo o premi Esc per uscire"
  }
};

export default function ProductGallery({ images, title, insetPrimary = false }: { images: string[]; title: string; insetPrimary?: boolean }) {
  const locale = localeFromPath(usePathname());
  const copy = galleryCopy[locale];
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const photos = images.length ? images : ["/products/placeholder-bag.svg"];

  function resetZoom() {
    setZoomed(false);
    setZoomOrigin("50% 50%");
  }

  function selectPhoto(index: number) {
    setSelected(index);
    resetZoom();
  }

  function moveZoom(event: MouseEvent<HTMLButtonElement>) {
    if (!zoomed) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed((current) => !current)}
        onMouseMove={moveZoom}
        onKeyDown={(event) => {
          if (event.key === "Escape") resetZoom();
        }}
        aria-label={zoomed ? copy.zoomOut : copy.zoomIn}
        aria-pressed={zoomed}
        className={`relative block aspect-square w-full overflow-hidden border border-sglInk focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"} ${selected === 0 ? "bg-[#ededeb]" : "bg-sglPaper"}`}
      >
        <Image
          src={photos[selected]}
          alt={`${title} — ${copy.image} ${selected + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ transformOrigin: zoomOrigin }}
          className={`transition-transform duration-200 ease-out ${zoomed ? "scale-[2.2]" : "scale-100"} ${selected === 0 ? (insetPrimary ? "object-contain p-10 mix-blend-darken" : "object-cover mix-blend-darken") : "object-contain p-4"}`}
        />
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 max-w-[calc(100%-1.5rem)] bg-sglInk/80 px-3 py-2 text-right text-xs font-medium text-sglCream backdrop-blur-sm">
          {zoomed ? copy.zoomOut : copy.zoomIn}
        </span>
      </button>
      {photos.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3" aria-label={copy.images}>
          {photos.map((src, index) => (
            <button key={`${src}-${index}`} type="button" onClick={() => selectPhoto(index)} aria-label={`${copy.show} ${title}, ${copy.image} ${index + 1}`} aria-pressed={selected === index} className={`relative aspect-square border bg-sglPaper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selected === index ? "border-sglInk ring-2 ring-sglInk" : "border-sglInk/25 hover:border-sglInk"}`}>
              <Image src={src} alt={`${title}, ${copy.thumbnail} ${index + 1}`} fill sizes="(max-width: 768px) 25vw, 12vw" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

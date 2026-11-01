"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const photos = images.length ? images : ["/products/placeholder-bag.svg"];
  return (
    <div>
      <div className="relative aspect-square border border-sglInk bg-sglPaper" aria-live="polite">
        <Image src={photos[selected]} alt={`${title} — image ${selected + 1}`} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-4" />
      </div>
      {photos.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3" aria-label="Product images">
          {photos.map((src, index) => (
            <button key={`${src}-${index}`} type="button" onClick={() => setSelected(index)} aria-label={`Show ${title} image ${index + 1}`} aria-pressed={selected === index} className={`relative aspect-square border bg-sglPaper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selected === index ? "border-sglInk ring-2 ring-sglInk" : "border-sglInk/25 hover:border-sglInk"}`}>
              <Image src={src} alt={`${title} thumbnail ${index + 1}`} fill sizes="(max-width: 768px) 25vw, 12vw" className="object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

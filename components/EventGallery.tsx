"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Photo = { src: string; alt: string; title: string; width: number; height: number };
export default function EventGallery({ photos, display = "cover" }: { photos: Photo[]; display?: "cover" | "grid" | "compact" }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const move = (step: number) => setIndex(current => (current + step + photos.length) % photos.length);
  const open = (photoIndex: number) => {
    setIndex(photoIndex);
    dialog.current?.showModal();
  };
  return (
    <>
      {display === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {photos.map((photo, photoIndex) => (
            <button key={photo.src} type="button" onClick={() => open(photoIndex)} className="group overflow-hidden border border-sglInk bg-sglCream text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={`View ${photo.title}`}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw" className="aspect-[2/3] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
              <span className="block border-t border-sglInk px-4 py-3 text-xs font-black uppercase leading-4 tracking-wide">{photo.title} ↗</span>
            </button>
          ))}
        </div>
      ) : display === "compact" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {photos.map((photo, photoIndex) => (
            <button key={photo.src} type="button" onClick={() => open(photoIndex)} className="group overflow-hidden border border-sglInk bg-sglCream text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={`View ${photo.title}`}>
              <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 639px) 100vw, 33vw" className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              <span className="block border-t border-sglInk px-4 py-3 text-xs font-black uppercase leading-4 tracking-wide">{photo.title} ↗</span>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => open(0)} className="group relative block w-full overflow-hidden border border-sglInk text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={`View exhibition gallery, ${photos.length} photos`}>
          <Image src={photos[0].src} alt={photos[0].alt} width={photos[0].width} height={photos[0].height} sizes="(max-width: 767px) 100vw, 1100px" className="h-auto w-full" />
          <span className="absolute bottom-4 right-4 bg-sglAcid px-4 py-3 text-sm font-black uppercase">View gallery · {photos.length} photos ↗</span>
        </button>
      )}
      <dialog ref={dialog} aria-label="Photo gallery" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if(event.key === 'ArrowRight') move(1); if(event.key === 'ArrowLeft') move(-1); }} className="m-auto w-[min(1100px,94vw)] max-h-[94dvh] border border-sglInk bg-sglCream p-4 text-sglInk backdrop:bg-black/80 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-4"><p className="font-bold">{index + 1} / {photos.length}</p><button type="button" autoFocus onClick={() => dialog.current?.close()} className="border border-sglInk px-4 py-2 font-bold" aria-label="Close gallery">Close ×</button></div>
        <div className="relative h-[60dvh]"><Image src={photos[index].src} alt={photos[index].alt} fill sizes="94vw" className="object-contain" /></div>
        <div className="mt-4 flex items-center justify-between gap-4"><button type="button" onClick={() => move(-1)} aria-label="Previous photo" className="p-3 text-2xl">←</button><p className="text-center font-bold">{photos[index].title}</p><button type="button" onClick={() => move(1)} aria-label="Next photo" className="p-3 text-2xl">→</button></div>
      </dialog>
    </>
  );
}

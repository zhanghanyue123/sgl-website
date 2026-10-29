"use client";

import { useState } from "react";

const films = [
  { src: "/videos/seagull.mp4", title: "Seagull — New York" },
  { src: "/videos/shanghai.mp4", title: "Story 001 — Shanghai" },
];

export default function Films() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  return (
    <div id="films" className="overflow-hidden border border-sglInk bg-black">
      <video
        key={films[index].src}
        className="aspect-video w-full"
        src={films[index].src}
        poster="/videos/poster.jpg"
        aria-label={films[index].title}
        autoPlay muted playsInline controls preload="metadata"
        onEnded={() => { setFailed(false); setIndex((index + 1) % films.length); }}
        onError={() => setFailed(true)}
      >
        Your browser does not support embedded video.
      </video>
      {failed && <p className="p-4 text-sm text-white">视频暂时无法加载。<a className="underline" href="https://www.youtube.com/@seagulllabs" target="_blank" rel="noopener noreferrer">在 YouTube 观看 ↗</a></p>}
    </div>
  );
}

"use client";

import { useState } from "react";

type FilmsProps = {
  src: string;
  title: string;
  poster?: string;
};

export default function Films({ src, title, poster = "/videos/poster.jpg" }: FilmsProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div id="films" className="overflow-hidden border border-sglInk bg-black">
      <video
        key={src}
        className="aspect-video w-full"
        src={src}
        poster={poster}
        aria-label={title}
        autoPlay muted playsInline controls preload="metadata"
        onError={() => setFailed(true)}
      >
        Your browser does not support embedded video.
      </video>
      {failed && <p className="p-4 text-sm text-white">视频暂时无法加载。<a className="underline" href="https://www.youtube.com/@seagulllabs" target="_blank" rel="noopener noreferrer">在 YouTube 观看 ↗</a></p>}
    </div>
  );
}

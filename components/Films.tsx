"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { localeFromPath, type Locale } from "@/lib/i18n";

const filmCopy: Record<Locale, { unsupported: string; failed: string; watch: string }> = {
  en: { unsupported: "Your browser does not support embedded video.", failed: "This video could not be loaded.", watch: "Watch on YouTube" },
  "zh-CN": { unsupported: "你的浏览器不支持嵌入式视频。", failed: "视频暂时无法加载。", watch: "在 YouTube 观看" },
  "ja-JP": { unsupported: "お使いのブラウザは埋め込み動画に対応していません。", failed: "動画を読み込めませんでした。", watch: "YouTubeで見る" },
  "ko-KR": { unsupported: "이 브라우저는 삽입된 동영상을 지원하지 않습니다.", failed: "동영상을 불러올 수 없습니다.", watch: "YouTube에서 보기" },
  "it-IT": { unsupported: "Il browser non supporta i video incorporati.", failed: "Non è stato possibile caricare il video.", watch: "Guarda su YouTube" }
};

type FilmsProps = {
  src: string;
  title: string;
  poster?: string;
  frameless?: boolean;
  loop?: boolean;
};

export default function Films({ src, title, poster = "/videos/poster.jpg", frameless = false, loop = false }: FilmsProps) {
  const copy = filmCopy[localeFromPath(usePathname())];
  const [failed, setFailed] = useState(false);
  return (
    <div id="films" className={`overflow-hidden bg-black${frameless ? "" : " border border-sglInk"}`}>
      <video
        key={src}
        className="aspect-video w-full"
        src={src}
        poster={poster}
        aria-label={title}
        autoPlay muted loop={loop} playsInline controls preload="metadata"
        onError={() => setFailed(true)}
      >
        {copy.unsupported}
      </video>
      {failed && <p className="p-4 text-sm text-white">{copy.failed} <a className="underline" href="https://www.youtube.com/@seagulllabs" target="_blank" rel="noopener noreferrer">{copy.watch} ↗</a></p>}
    </div>
  );
}

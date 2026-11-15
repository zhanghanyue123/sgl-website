"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/data/products";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";
import { useCartAdd } from "./useCartAdd";

const quickAddCopy: Record<Locale, { add: string; adding: string; added: string; choose: string; error: string; soldOut: string }> = {
  en: { add: "Quick add", adding: "Adding…", added: "Added", choose: "Choose options", error: "Could not add. Try again.", soldOut: "Sold out" },
  "zh-CN": { add: "快速加入", adding: "正在加入…", added: "已加入", choose: "选择规格", error: "加入失败，请重试。", soldOut: "售罄" },
  "ja-JP": { add: "クイック追加", adding: "追加中…", added: "追加済み", choose: "オプションを選択", error: "追加できませんでした。", soldOut: "売り切れ" },
  "ko-KR": { add: "빠른 담기", adding: "담는 중…", added: "담기 완료", choose: "옵션 선택", error: "담지 못했습니다.", soldOut: "품절" },
  "it-IT": { add: "Aggiungi", adding: "Aggiunta…", added: "Aggiunto", choose: "Scegli opzioni", error: "Aggiunta non riuscita.", soldOut: "Esaurito" }
};

export default function ProductCard({ product }: { product: Product }) {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const copy = quickAddCopy[locale];
  const cartAdd = useCartAdd();
  const image = product.images[0] || "/products/placeholder-bag.svg";
  const isTee = product.slug.includes("tee");
  const useInsetComposition = product.slug === "pin" || isTee;
  const availableVariants = product.variants.length
    ? product.variants.flatMap((variant, index) => variant.soldOut ? [] : [index])
    : product.soldOut ? [] : [0];
  const productPath = localizedPath(`/shop/${product.slug}`, locale);
  const canQuickAdd = !product.soldOut && availableVariants.length === 1;

  return (
    <article className="group overflow-hidden border border-sglInk bg-sglPaper transition hover:-translate-y-1 hover:shadow-[8px_8px_0_#111111]">
      <Link href={productPath} className="block">
        <div className={`relative flex items-center justify-center overflow-hidden border-b border-sglInk bg-[#ededeb] ${isTee ? "aspect-square" : "aspect-[4/5]"}`}>
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={isTee ? "object-contain p-3 mix-blend-darken" : useInsetComposition ? "object-contain p-8 mix-blend-darken" : "object-cover mix-blend-darken"}
          />
        </div>

        <div className="p-5 pb-3">
          {product.soldOut && <p className="mb-3 inline-block border border-sglInk bg-sglInk px-3 py-1 text-xs font-black uppercase tracking-wide text-sglCream">{copy.soldOut}</p>}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-60">
                {product.category}
              </p>

              <h3 className="mt-2 text-xl font-black leading-tight">
                {product.title}
              </h3>
            </div>

            <p className="shrink-0 whitespace-nowrap border border-sglInk bg-sglAcid px-3 py-1 text-sm font-black">
              $ {product.priceLabel}
            </p>
          </div>
        </div>
      </Link>
      <div className="px-5 pb-5">
        {canQuickAdd ? <button disabled={!cartAdd.ready || cartAdd.busy} aria-busy={cartAdd.busy} onClick={() => void cartAdd.submit(product.slug, availableVariants[0], 1)} className="w-full border border-sglInk bg-sglAcid px-4 py-3 text-sm font-black uppercase disabled:opacity-50">{cartAdd.busy ? copy.adding : cartAdd.status === "added" ? copy.added : copy.add}</button> : !product.soldOut && availableVariants.length > 1 ? <Link href={productPath} className="block w-full border border-sglInk px-4 py-3 text-center text-sm font-black uppercase">{copy.choose}</Link> : null}
        <p aria-live="polite" className="mt-2 min-h-5 text-sm">{cartAdd.status === "error" && <span role="alert">{copy.error}</span>}</p>
      </div>
    </article>
  );
}

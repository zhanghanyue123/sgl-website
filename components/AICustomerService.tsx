"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";

type Topic = "products" | "shipping" | "station";

type AssistantCopy = {
  title: string;
  status: string;
  greeting: string;
  prompt: string;
  open: string;
  close: string;
  emailLead: string;
  email: string;
  topics: Record<Topic, { label: string; answer: string; cta: string; href: string }>;
};

const copy: Record<Locale, AssistantCopy> = {
  en: {
    title: "SGL AI Assistant",
    status: "Quick help",
    greeting: "Hi! I can help you find product, delivery and Seagull Station information.",
    prompt: "What can I help with?",
    open: "Open SGL AI customer service",
    close: "Close SGL AI customer service",
    emailLead: "Need more help?",
    email: "Email SGL",
    topics: {
      products: { label: "Products & stock", answer: "Browse the current collection and USD prices. Please email SGL to confirm live stock before ordering.", cta: "View products", href: "/shop" },
      shipping: { label: "Shipping & payment", answer: "Shipping, taxes and timing are confirmed for each order. International card checkout uses Stripe when online checkout is available.", cta: "Sales & shipping", href: "/shipping" },
      station: { label: "Visit Station", answer: "Seagull Station is in Shanghai for coffee, goods, rides and community activity. Check the Station page for the address and visit details.", cta: "View Station", href: "/station" }
    }
  },
  "zh-CN": {
    title: "SGL AI 客服",
    status: "快捷帮助",
    greeting: "你好！我可以帮你快速找到商品、配送和 Seagull Station 信息。",
    prompt: "你想了解什么？",
    open: "打开 SGL AI 客服",
    close: "关闭 SGL AI 客服",
    emailLead: "还需要帮助？",
    email: "发送邮件给 SGL",
    topics: {
      products: { label: "商品与库存", answer: "查看当前商品与美元价格。下单前请发送邮件向 SGL 确认实时库存。", cta: "查看商品", href: "/shop" },
      shipping: { label: "配送与支付", answer: "运费、税费和发货时间按订单确认；开放线上结账时，海外银行卡支付使用 Stripe。", cta: "销售与配送", href: "/shipping" },
      station: { label: "到访 Station", answer: "Seagull Station 位于上海，提供咖啡、商品、骑行与社群活动。地址与到访信息请查看 Station 页面。", cta: "查看 Station", href: "/station" }
    }
  },
  "ja-JP": {
    title: "SGL AI サポート",
    status: "クイックヘルプ",
    greeting: "こんにちは。商品、配送、Seagull Station の情報をご案内します。",
    prompt: "何をお探しですか？",
    open: "SGL AIサポートを開く",
    close: "SGL AIサポートを閉じる",
    emailLead: "さらにサポートが必要ですか？",
    email: "SGLへメール",
    topics: {
      products: { label: "商品・在庫", answer: "現在の商品と米ドル価格をご覧いただけます。ご注文前に在庫をメールでご確認ください。", cta: "商品を見る", href: "/shop" },
      shipping: { label: "配送・お支払い", answer: "送料、税金、発送時期は注文ごとに確認します。オンライン決済利用時の海外カード決済には Stripe を使用します。", cta: "販売・配送情報", href: "/shipping" },
      station: { label: "Stationへの訪問", answer: "上海の Seagull Station では、コーヒー、商品、ライド、コミュニティ活動を展開しています。住所は Station ページでご確認ください。", cta: "Stationを見る", href: "/station" }
    }
  },
  "ko-KR": {
    title: "SGL AI 고객지원",
    status: "빠른 도움",
    greeting: "안녕하세요! 상품, 배송, Seagull Station 정보를 빠르게 찾아드릴게요.",
    prompt: "무엇을 도와드릴까요?",
    open: "SGL AI 고객지원 열기",
    close: "SGL AI 고객지원 닫기",
    emailLead: "도움이 더 필요하신가요?",
    email: "SGL에 이메일 보내기",
    topics: {
      products: { label: "상품 및 재고", answer: "현재 상품과 USD 가격을 확인하세요. 주문 전 이메일로 실시간 재고를 확인해 주세요.", cta: "상품 보기", href: "/shop" },
      shipping: { label: "배송 및 결제", answer: "배송비, 세금, 발송 일정은 주문별로 확인됩니다. 온라인 결제 제공 시 해외 카드 결제는 Stripe를 사용합니다.", cta: "판매 및 배송", href: "/shipping" },
      station: { label: "Station 방문", answer: "상하이 Seagull Station에서 커피, 상품, 라이딩과 커뮤니티 활동을 만날 수 있습니다. 주소는 Station 페이지에서 확인하세요.", cta: "Station 보기", href: "/station" }
    }
  },
  "it-IT": {
    title: "Assistente AI SGL",
    status: "Aiuto rapido",
    greeting: "Ciao! Posso aiutarti a trovare informazioni su prodotti, spedizioni e Seagull Station.",
    prompt: "Come posso aiutarti?",
    open: "Apri l'assistenza AI SGL",
    close: "Chiudi l'assistenza AI SGL",
    emailLead: "Serve altro aiuto?",
    email: "Scrivi a SGL",
    topics: {
      products: { label: "Prodotti e disponibilità", answer: "Scopri la collezione e i prezzi in USD. Prima dell'ordine, conferma la disponibilità via email.", cta: "Vedi i prodotti", href: "/shop" },
      shipping: { label: "Spedizioni e pagamenti", answer: "Spedizione, tasse e tempi vengono confermati per ogni ordine. Quando disponibile, il pagamento internazionale online usa Stripe.", cta: "Vendite e spedizioni", href: "/shipping" },
      station: { label: "Visita la Station", answer: "Seagull Station è a Shanghai: caffè, prodotti, uscite in bici e attività della community. Consulta la pagina Station per l'indirizzo.", cta: "Vedi la Station", href: "/station" }
    }
  }
};

const topics: Topic[] = ["products", "shipping", "station"];

export default function AICustomerService() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const c = copy[locale];
  const [open, setOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const active = activeTopic ? c.topics[activeTopic] : null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <section
          id="sgl-ai-customer-service"
          role="dialog"
          aria-label={c.title}
          className="absolute bottom-[5.25rem] right-0 w-[min(23rem,calc(100vw-2rem))] overflow-hidden border border-[#b8b4aa] bg-sglPaper shadow-[0_12px_32px_rgba(17,17,17,0.14)]"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[#b8b4aa] bg-sglAcid px-4 py-3">
            <div>
              <p className="text-base font-black uppercase leading-none">{c.title}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] opacity-65">{c.status}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.close}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#aaa69d] bg-sglPaper text-xl font-black leading-none transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-sglPaper"
            >
              ×
            </button>
          </div>

          <div className="max-h-[min(34rem,calc(100vh-9rem))] overflow-y-auto p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#d8d5cd] bg-sglPaper">
                <Image src="/assistant/sgl-ai-assistant.webp" alt="" width={48} height={48} className="h-full w-full translate-y-0.5 object-contain" />
              </div>
              <p className="rounded-br-xl rounded-tr-xl rounded-bl-xl bg-sglFog px-4 py-3 text-sm font-bold leading-5">{c.greeting}</p>
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] opacity-55">{c.prompt}</p>
            <div className="mt-3 grid gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setActiveTopic(topic)}
                  className={`border px-4 py-3 text-left text-sm font-black uppercase transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sglAcid ${activeTopic === topic ? "border-[#77736b] bg-sglGraphite text-sglPaper" : "border-[#c3bfb5] bg-sglPaper hover:bg-sglAcid"}`}
                >
                  {c.topics[topic].label}
                </button>
              ))}
            </div>

            {active && (
              <div className="mt-3 border border-[#c3bfb5] bg-sglCream p-4">
                <p className="text-sm font-bold leading-6">{active.answer}</p>
                <Link
                  href={localizedPath(active.href, locale)}
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex border border-[#aaa69d] bg-sglAcid px-4 py-2 text-xs font-black uppercase tracking-wide"
                >
                  {active.cta} →
                </Link>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-sglInk/20 pt-4 text-sm">
              <span className="font-bold opacity-65">{c.emailLead}</span>
              <a href="mailto:hello@theseagulllabs.com" className="shrink-0 font-black underline decoration-2 underline-offset-4">{c.email}</a>
            </div>
          </div>
        </section>
      )}

      <div className="relative h-[4.5rem] w-[4.5rem]">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? c.close : c.open}
          aria-expanded={open}
          aria-controls="sgl-ai-customer-service"
          className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-[#d5d2ca] bg-sglPaper shadow-[0_8px_22px_rgba(17,17,17,0.14)] transition hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-sglAcid motion-reduce:transform-none"
        >
          <Image
            src="/assistant/sgl-ai-assistant.webp"
            alt=""
            width={72}
            height={72}
            priority
            className="h-full w-full translate-y-1.5 scale-[1.08] object-contain"
          />
        </button>
        <span className="pointer-events-none absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-sglPaper bg-green-500" aria-hidden="true" />
      </div>
    </div>
  );
}

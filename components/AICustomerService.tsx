"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n";

type Topic = "products" | "shipping" | "station";
type StoredConversation = { id: string; token: string };
type Message = { id: string; sender_type: string; body: string; created_at?: string };

type AssistantCopy = {
  title: string;
  subtitle: string;
  hello: string;
  prompt: string;
  otherQuestions: string;
  placeholder: string;
  send: string;
  humanSend: string;
  ticket: string;
  ticketSaved: string;
  limited: string;
  unavailable: string;
  locked: string;
  name: string;
  email: string;
  open: string;
  close: string;
  privacy: string;
  topics: Record<Topic, { label: string; answer: string; cta: string; href: string }>;
  senders: Record<"customer" | "ai" | "staff" | "system", string>;
};

const copy: Record<Locale, AssistantCopy> = {
  en: {
    title: "Fries · SGL Guide",
    subtitle: "Quick answers first · Agent for other questions",
    hello: "Hi, I’m Fries. Choose a quick question below, or ask me something else.",
    prompt: "Quick questions",
    otherQuestions: "Something else? Ask Fries",
    placeholder: "Ask about SGL products, care, shipping or returns",
    send: "Ask Fries",
    humanSend: "Send to support",
    ticket: "Human support",
    ticketSaved: "Support ticket saved. No email was sent.",
    limited: "Some information is unavailable. I can create a support ticket.",
    unavailable: "Support is temporarily unavailable. Please try again.",
    locked: "A human support teammate has taken over. Fries is paused, but you can keep sending messages here.",
    name: "Name (optional)",
    email: "Email (optional)",
    open: "Open Fries customer service",
    close: "Close Fries customer service",
    privacy: "Do not share payment details. Prices, live inventory, delivery dates and account-specific orders are only stated when verified by an approved source.",
    topics: {
      products: { label: "Products & stock", answer: "Browse the current collection and USD prices. Please email SGL to confirm live stock before ordering.", cta: "View products", href: "/shop" },
      shipping: { label: "Shipping & payment", answer: "Shipping, taxes and timing are confirmed for each order. International card checkout uses Stripe when online checkout is available.", cta: "Sales & shipping", href: "/shipping" },
      station: { label: "Visit Station", answer: "Seagull Station is in Shanghai for coffee, goods, rides and community activity. Check the Station page for the address and visit details.", cta: "View Station", href: "/station" }
    },
    senders: { customer: "You", ai: "Fries", staff: "Support", system: "System" }
  },
  "zh-CN": {
    title: "Fries · SGL 向导",
    subtitle: "常见问题直接回答 · 其他问题由 Agent 处理",
    hello: "你好，我是 Fries。可以先选择下面的常见问题，也可以问我其他问题。",
    prompt: "常见问题",
    otherQuestions: "还有其他问题？问 Fries",
    placeholder: "询问 SGL 商品、保养、配送或退换货",
    send: "问 Fries",
    humanSend: "发送给人工客服",
    ticket: "转人工客服",
    ticketSaved: "人工客服工单已保存，未发送邮件。",
    limited: "部分信息暂不可用，可以创建人工工单。",
    unavailable: "客服暂时不可用，请稍后重试。",
    locked: "人工客服已接管本次对话。Fries 已暂停，你仍可在这里继续留言。",
    name: "姓名（选填）",
    email: "邮箱（选填）",
    open: "打开 Fries 客服",
    close: "关闭 Fries 客服",
    privacy: "请勿分享支付信息。价格、实时库存、交期和具体订单仅在有已审核来源时提供。",
    topics: {
      products: { label: "商品与库存", answer: "查看当前商品与美元价格。下单前请发送邮件向 SGL 确认实时库存。", cta: "查看商品", href: "/shop" },
      shipping: { label: "配送与支付", answer: "运费、税费和发货时间按订单确认；开放线上结账时，海外银行卡支付使用 Stripe。", cta: "销售与配送", href: "/shipping" },
      station: { label: "到访 Station", answer: "Seagull Station 位于上海，提供咖啡、商品、骑行与社群活动。地址与到访信息请查看 Station 页面。", cta: "查看 Station", href: "/station" }
    },
    senders: { customer: "你", ai: "Fries", staff: "人工客服", system: "系统" }
  },
  "ja-JP": {
    title: "Fries · SGLガイド",
    subtitle: "よくある質問はすぐ回答 · その他はAgentへ",
    hello: "こんにちは、Friesです。よくある質問を選ぶか、別の質問を入力してください。",
    prompt: "よくある質問",
    otherQuestions: "別の質問をFriesに聞く",
    placeholder: "SGLの商品、お手入れ、配送、返品について質問",
    send: "Friesに聞く",
    humanSend: "担当者に送信",
    ticket: "担当者へ",
    ticketSaved: "サポートチケットを保存しました。メールは送信していません。",
    limited: "一部の情報は利用できません。サポートチケットを作成できます。",
    unavailable: "サポートは一時的に利用できません。しばらくしてからお試しください。",
    locked: "担当者がこの会話を引き継ぎました。Friesは停止中ですが、ここからメッセージを送れます。",
    name: "お名前（任意）",
    email: "メール（任意）",
    open: "Friesサポートを開く",
    close: "Friesサポートを閉じる",
    privacy: "支払い情報は共有しないでください。価格、在庫、納期、個別注文は承認済み情報がある場合のみご案内します。",
    topics: {
      products: { label: "商品・在庫", answer: "現在の商品と米ドル価格をご覧いただけます。ご注文前に在庫をメールでご確認ください。", cta: "商品を見る", href: "/shop" },
      shipping: { label: "配送・お支払い", answer: "送料、税金、発送時期は注文ごとに確認します。オンライン決済利用時の海外カード決済には Stripe を使用します。", cta: "販売・配送情報", href: "/shipping" },
      station: { label: "Stationへの訪問", answer: "上海の Seagull Station では、コーヒー、商品、ライド、コミュニティ活動を展開しています。住所は Station ページでご確認ください。", cta: "Stationを見る", href: "/station" }
    },
    senders: { customer: "あなた", ai: "Fries", staff: "担当者", system: "システム" }
  },
  "ko-KR": {
    title: "Fries · SGL 가이드",
    subtitle: "자주 묻는 질문은 바로 답변 · 그 외 질문은 Agent로",
    hello: "안녕하세요, Fries예요. 자주 묻는 질문을 고르거나 다른 질문을 입력해 주세요.",
    prompt: "자주 묻는 질문",
    otherQuestions: "다른 질문을 Fries에게 묻기",
    placeholder: "SGL 상품, 관리, 배송 또는 반품에 대해 질문",
    send: "Fries에게 묻기",
    humanSend: "상담원에게 보내기",
    ticket: "상담원 연결",
    ticketSaved: "지원 티켓이 저장되었습니다. 이메일은 전송되지 않았습니다.",
    limited: "일부 정보는 사용할 수 없습니다. 지원 티켓을 만들 수 있습니다.",
    unavailable: "지원 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    locked: "상담원이 이 대화를 인계받았습니다. Fries는 멈추지만 여기에서 계속 메시지를 보낼 수 있습니다.",
    name: "이름 (선택)",
    email: "이메일 (선택)",
    open: "Fries 고객지원 열기",
    close: "Fries 고객지원 닫기",
    privacy: "결제 정보를 공유하지 마세요. 가격, 실시간 재고, 배송일 및 개별 주문은 승인된 정보가 있을 때만 안내합니다.",
    topics: {
      products: { label: "상품 및 재고", answer: "현재 상품과 USD 가격을 확인하세요. 주문 전 이메일로 실시간 재고를 확인해 주세요.", cta: "상품 보기", href: "/shop" },
      shipping: { label: "배송 및 결제", answer: "배송비, 세금, 발송 일정은 주문별로 확인됩니다. 온라인 결제 제공 시 해외 카드 결제는 Stripe를 사용합니다.", cta: "판매 및 배송", href: "/shipping" },
      station: { label: "Station 방문", answer: "상하이 Seagull Station에서 커피, 상품, 라이딩과 커뮤니티 활동을 만날 수 있습니다. 주소는 Station 페이지에서 확인하세요.", cta: "Station 보기", href: "/station" }
    },
    senders: { customer: "나", ai: "Fries", staff: "상담원", system: "시스템" }
  },
  "it-IT": {
    title: "Fries · Guida SGL",
    subtitle: "Risposte rapide prima · Agent per le altre domande",
    hello: "Ciao, sono Fries. Scegli una domanda frequente oppure chiedimi altro.",
    prompt: "Domande frequenti",
    otherQuestions: "Un’altra domanda? Chiedi a Fries",
    placeholder: "Chiedi di prodotti SGL, cura, spedizioni o resi",
    send: "Chiedi a Fries",
    humanSend: "Invia all'assistenza",
    ticket: "Assistenza umana",
    ticketSaved: "Ticket salvato. Nessuna email è stata inviata.",
    limited: "Alcune informazioni non sono disponibili. Posso creare un ticket.",
    unavailable: "L'assistenza non è temporaneamente disponibile. Riprova tra poco.",
    locked: "Un operatore ha preso in carico la conversazione. Fries è in pausa, ma puoi continuare a scrivere qui.",
    name: "Nome (facoltativo)",
    email: "Email (facoltativa)",
    open: "Apri l'assistenza Fries",
    close: "Chiudi l'assistenza Fries",
    privacy: "Non condividere dati di pagamento. Prezzi, disponibilità, date di consegna e ordini specifici vengono indicati solo con una fonte approvata.",
    topics: {
      products: { label: "Prodotti e disponibilità", answer: "Scopri la collezione e i prezzi in USD. Prima dell'ordine, conferma la disponibilità via email.", cta: "Vedi i prodotti", href: "/shop" },
      shipping: { label: "Spedizioni e pagamenti", answer: "Spedizione, tasse e tempi vengono confermati per ogni ordine. Quando disponibile, il pagamento internazionale online usa Stripe.", cta: "Vendite e spedizioni", href: "/shipping" },
      station: { label: "Visita la Station", answer: "Seagull Station è a Shanghai: caffè, prodotti, uscite in bici e attività della community. Consulta la pagina Station per l'indirizzo.", cta: "Vedi la Station", href: "/station" }
    },
    senders: { customer: "Tu", ai: "Fries", staff: "Assistenza", system: "Sistema" }
  }
};

const topics: Topic[] = ["products", "shipping", "station"];

export default function AICustomerService() {
  const locale = localeFromPath(usePathname());
  const labels = copy[locale];
  const [open, setOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<StoredConversation | null>(null);
  const [limited, setLimited] = useState(false);
  const [aiLocked, setAiLocked] = useState(false);
  const active = activeTopic ? labels.topics[activeTopic] : null;

  useEffect(() => {
    try {
      const value = sessionStorage.getItem("sgl-public-support");
      if (!value) return;
      const parsed = JSON.parse(value) as Partial<StoredConversation>;
      if (typeof parsed.id === "string" && /^[0-9a-f-]{36}$/i.test(parsed.id) && typeof parsed.token === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(parsed.token)) {
        setConversation({ id: parsed.id, token: parsed.token });
      } else {
        sessionStorage.removeItem("sgl-public-support");
      }
    } catch {
      sessionStorage.removeItem("sgl-public-support");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!open || !conversation) return;
    const controller = new AbortController();
    const update = () => {
      if (document.visibilityState === "visible") void refresh(conversation, controller.signal);
    };
    update();
    const timer = window.setInterval(update, 15_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [open, conversation]);

  async function refresh(next: StoredConversation, signal?: AbortSignal) {
    try {
      const response = await fetch(`/api/support/conversations/${next.id}`, {
        headers: { authorization: `Bearer ${next.token}` },
        signal
      });
      if (response.status === 401 || response.status === 404) {
        sessionStorage.removeItem("sgl-public-support");
        setConversation(null);
        setMessages([]);
        setAiLocked(false);
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setAiLocked(data.conversation?.human_handoff_requested === true || data.conversation?.status === "waiting_staff");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus(labels.unavailable);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setStatus("");
    try {
      if (!conversation) {
        const response = await fetch("/api/support/conversations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale, message: text.trim(), name: name.trim() || undefined, email: email.trim() || undefined })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const next = { id: data.conversationId, token: data.accessToken };
        setConversation(next);
        sessionStorage.setItem("sgl-public-support", JSON.stringify(next));
        setLimited(data.answer?.confidence === "limited");
        setAiLocked(data.answer?.humanHandoffRecommended === true);
        setText("");
        await refresh(next);
      } else {
        const response = await fetch("/api/support/chat", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${conversation.token}` },
          body: JSON.stringify({ conversationId: conversation.id, message: text.trim() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAiLocked(data.answer?.aiLocked === true || data.answer?.humanHandoffRecommended === true);
        setLimited(data.answer?.confidence === "limited");
        setText("");
        await refresh(conversation);
      }
    } catch (error) {
      setStatus(error instanceof Error && error.message ? error.message : labels.unavailable);
    } finally {
      setBusy(false);
    }
  }

  async function createTicket() {
    if (!conversation || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${conversation.token}` },
        body: JSON.stringify({ conversationId: conversation.id, category: "general_feedback", priority: "normal", summary: messages.at(-1)?.body || labels.ticket })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(labels.ticketSaved);
      await refresh(conversation);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : labels.limited);
    } finally {
      setBusy(false);
    }
  }

  function chooseTopic(topic: Topic) {
    setActiveTopic(topic);
    setStatus("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <section
          id="sgl-ai-customer-service"
          role="dialog"
          aria-label={labels.title}
          className="absolute bottom-[5.25rem] right-0 w-[min(26rem,calc(100vw-2rem))] overflow-hidden border border-[#c8c5bd] bg-sglPaper shadow-[0_12px_32px_rgba(17,17,17,.14)]"
        >
          <header className="flex items-center justify-between gap-4 border-b border-[#c8c5bd] bg-sglAcid p-4">
            <div>
              <p className="font-black uppercase">{labels.title}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-60">{labels.subtitle}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={labels.close} className="h-8 w-8 shrink-0 rounded-full border border-[#c8c5bd] bg-white font-black">×</button>
          </header>

          <div className="max-h-[min(36rem,calc(100vh-9rem))] overflow-y-auto p-4">
            <div className="flex items-start gap-3">
              <Image src="/assistant/sgl-ai-assistant.webp" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full border border-[#ddd] object-contain" />
              <p className="rounded-br-xl rounded-tr-xl rounded-bl-xl bg-sglFog p-3 text-sm font-bold leading-5">{labels.hello}</p>
            </div>

            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] opacity-55">{labels.prompt}</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => chooseTopic(topic)}
                  className={`border px-3 py-2 text-left text-xs font-black uppercase transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sglAcid ${activeTopic === topic ? "border-[#77736b] bg-sglGraphite text-sglPaper" : "border-[#c3bfb5] bg-sglPaper hover:bg-sglAcid"}`}
                >
                  {labels.topics[topic].label}
                </button>
              ))}
            </div>

            {active && (
              <div className="mt-3 space-y-2" data-answer-source="preset">
                <div className="ml-auto max-w-[86%] rounded-bl-xl rounded-tl-xl rounded-br-xl bg-sglAcid px-4 py-3 text-sm font-bold">{active.label}</div>
                <div className="max-w-[92%] rounded-br-xl rounded-tr-xl rounded-bl-xl bg-sglFog px-4 py-3 text-sm leading-5">
                  <p className="mb-1 text-[10px] font-black uppercase opacity-55">Fries</p>
                  <p>{active.answer}</p>
                  <Link href={localizedPath(active.href, locale)} onClick={() => setOpen(false)} className="mt-3 inline-flex border border-[#aaa69d] bg-sglPaper px-3 py-2 text-[11px] font-black uppercase tracking-wide">
                    {active.cta} →
                  </Link>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-sglInk/15 pt-4">
                {messages.map((message) => (
                  <div key={message.id} className={`max-w-[86%] rounded-xl px-4 py-3 text-sm leading-5 ${message.sender_type === "customer" ? "ml-auto bg-sglAcid" : "bg-sglFog"}`}>
                    <p className="mb-1 text-[10px] font-black uppercase opacity-55">{labels.senders[message.sender_type as keyof typeof labels.senders] || message.sender_type}</p>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </div>
                ))}
              </div>
            )}

            {limited && <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-xs font-bold">{labels.limited}</p>}
            {aiLocked && <p className="mt-3 border border-blue-300 bg-blue-50 p-3 text-xs font-bold">{labels.locked}</p>}

            <p className="mt-5 border-t border-sglInk/15 pt-4 text-[11px] font-black uppercase tracking-[0.16em] opacity-55">{labels.otherQuestions}</p>
            <form onSubmit={submit} className="mt-2">
              {!conversation && (
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder={labels.name} maxLength={160} autoComplete="name" className="min-w-0 border border-[#aaa] bg-white p-2 text-xs" />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={labels.email} maxLength={320} type="email" autoComplete="email" className="min-w-0 border border-[#aaa] bg-white p-2 text-xs" />
                </div>
              )}
              <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={aiLocked ? labels.humanSend : labels.placeholder} maxLength={2000} rows={3} className="w-full border border-[#aaa] bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-sglAcid" />
              <div className="mt-2 flex gap-2">
                <button type="submit" disabled={busy || !text.trim()} className="flex-1 border border-sglInk bg-sglAcid px-3 py-2 text-xs font-black uppercase disabled:opacity-50">{aiLocked ? labels.humanSend : labels.send}</button>
                {conversation && <button type="button" disabled={busy} onClick={createTicket} className="border border-[#aaa] px-3 py-2 text-xs font-black uppercase disabled:opacity-50">{labels.ticket}</button>}
              </div>
            </form>
            <p role="status" className="mt-2 min-h-4 text-xs font-bold">{status}</p>
            <p className="mt-3 border-t border-sglInk/15 pt-3 text-[10px] leading-4 opacity-60">{labels.privacy}</p>
          </div>
        </section>
      )}

      <div className="relative h-[4.5rem] w-[4.5rem] transition hover:-translate-y-1 motion-reduce:transform-none">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? labels.close : labels.open}
          aria-expanded={open}
          aria-controls="sgl-ai-customer-service"
          className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-[#d5d2ca] bg-sglPaper shadow-[0_8px_22px_rgba(17,17,17,0.14)] focus:outline-none focus-visible:ring-4 focus-visible:ring-sglAcid"
        >
          <Image src="/assistant/sgl-ai-assistant.webp" alt="" width={72} height={72} priority className="h-full w-full translate-y-1.5 scale-[1.08] object-contain" />
        </button>
        <span className="pointer-events-none absolute right-[3px] top-[3px] z-10 h-4 w-4 rounded-full border-2 border-sglPaper bg-green-500" aria-hidden="true" />
      </div>
    </div>
  );
}

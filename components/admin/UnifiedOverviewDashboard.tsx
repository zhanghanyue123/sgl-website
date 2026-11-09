import Link from "next/link";
import type { OverviewMetric, OverviewStatus, UnifiedOverview } from "@/lib/admin/unified-overview";

const statusCopy: Record<OverviewStatus, string> = { ok: "Live", stale: "Stale", not_connected: "Not Connected", error: "Error", n_a: "N/A" };
const statusStyle: Record<OverviewStatus, string> = {
  ok: "border-emerald-800 bg-emerald-50 text-emerald-900",
  stale: "border-amber-700 bg-amber-50 text-amber-900",
  not_connected: "border-slate-400 bg-slate-100 text-slate-700",
  error: "border-red-700 bg-red-50 text-red-900",
  n_a: "border-slate-400 bg-white text-slate-600"
};

function StatusBadge({ status }: { status: OverviewStatus }) {
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyle[status]}`}>{statusCopy[status]}</span>;
}

function time(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Shanghai" }).format(new Date(value));
}

function display(metric: OverviewMetric) {
  if (metric.value === null || metric.status === "not_connected" || metric.status === "error" || metric.status === "n_a") return metric.status === "not_connected" ? "Not Connected" : metric.status === "error" ? "N/A" : "N/A";
  if (metric.unit === "cents") return new Intl.NumberFormat("en-US", { style: "currency", currency: metric.currency || "USD" }).format(Number(metric.value) / 100);
  if (metric.unit === "percent") return `${metric.value}%`;
  return new Intl.NumberFormat("en-US").format(Number(metric.value));
}

function SourceLine({ metric }: { metric: OverviewMetric }) {
  return <p className="mt-3 text-[10px] leading-4 opacity-60">来源：{metric.sourceSystem} · {metric.sourceRef}<br />更新：{time(metric.asOf)}</p>;
}

function MetricCard({ label, metric, accent = false }: { label: string; metric: OverviewMetric; accent?: boolean }) {
  return <article className={`border border-sglInk p-4 shadow-[4px_4px_0_#111] ${accent ? "bg-sglAcid" : "bg-white"}`}>
    <div className="flex items-start justify-between gap-2"><p className="text-xs font-black uppercase tracking-wider opacity-65">{label}</p><StatusBadge status={metric.status} /></div>
    <p className="mt-4 break-words text-3xl font-black leading-none">{display(metric)}</p>
    <SourceLine metric={metric} />
  </article>;
}

function SalesCard({ label, metrics, accent = false }: { label: string; metrics: OverviewMetric[]; accent?: boolean }) {
  const status = metrics.some(item => item.status === "error") ? "error" : metrics.some(item => item.status === "not_connected") ? "not_connected" : metrics.some(item => item.status === "stale") ? "stale" : "ok";
  return <article className={`border border-sglInk p-4 shadow-[4px_4px_0_#111] ${accent ? "bg-sglAcid" : "bg-white"}`}><div className="flex items-start justify-between gap-2"><p className="text-xs font-black uppercase tracking-wider opacity-65">{label}</p><StatusBadge status={status} /></div><div className="mt-4 space-y-1">{metrics.map(item => <p key={item.key} className="break-words text-3xl font-black leading-none">{display(item)}</p>)}</div><p className="mt-3 text-[10px] leading-4 opacity-60">来源：website · PostgreSQL payment ledger<br />更新：{time(metrics[0]?.asOf || null)}</p></article>;
}

export default function UnifiedOverviewDashboard({ overview }: { overview: UnifiedOverview }) {
  const orders = Object.values(overview.commerce.orderStates).reduce((sum, value) => sum + value, 0);
  const paid = (overview.commerce.paymentStates.paid || 0) + (overview.commerce.paymentStates.partially_refunded || 0) + (overview.commerce.paymentStates.refunded || 0);
  const orderMetric: OverviewMetric = { key: "orders.total", value: Object.keys(overview.commerce.orderStates).length ? orders : null, unit: "orders", status: Object.keys(overview.commerce.orderStates).length ? "ok" : "not_connected", sourceSystem: "website", sourceRef: "postgresql:orders", period: { from: null, to: overview.generatedAt }, asOf: overview.generatedAt, definition: "All Website order records", errorCode: null };
  const paidMetric: OverviewMetric = { ...orderMetric, key: "payments.confirmed", value: Object.keys(overview.commerce.paymentStates).length ? paid : null, unit: "events", sourceRef: "postgresql:payments", definition: "Payments in confirmed paid or refunded ledger states" };

  return <div className="space-y-8">
    <section aria-labelledby="business-performance">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.22em] opacity-60">Owner Dashboard</p><h2 id="business-performance" className="text-2xl font-black uppercase">Business Performance</h2></div><p className="text-xs font-bold">统计时区：{overview.timezone} · 生成：{time(overview.generatedAt)}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SalesCard label="今日净销售" metrics={overview.commerce.todaySales} accent />
        <SalesCard label="本月净销售" metrics={overview.commerce.monthSales} />
        <MetricCard label="订单总数" metric={orderMetric} />
        <MetricCard label="确认支付" metric={paidMetric} />
        <MetricCard label="可售库存" metric={overview.inventory.totalAvailable} />
        <MetricCard label="低库存项" metric={overview.inventory.lowStock} />
      </div>
      {(overview.commerce.todaySales.length > 1 || overview.commerce.monthSales.length > 1) && <p className="mt-3 border border-amber-700 bg-amber-50 p-3 text-xs font-bold">存在多币种支付。Dashboard 按币种分别返回，不进行汇率换算或跨币种合计。</p>}
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="border border-sglInk bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black uppercase">Small Bags Sell-through</h2><StatusBadge status={overview.inventory.smallBags.actual.status} /></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="text-xs font-black uppercase opacity-60">实际可售库存</p><p className="mt-2 text-3xl font-black">{display(overview.inventory.smallBags.actual)}</p></div><div><p className="text-xs font-black uppercase opacity-60">消化目标</p><p className="mt-2 text-3xl font-black">2,500</p><p className="mt-1 text-xs font-bold text-red-700">目标，不是实际库存</p></div><div><p className="text-xs font-black uppercase opacity-60">消化进度</p><p className="mt-2 text-3xl font-black">{display(overview.inventory.smallBags.progress)}</p></div></div>
        <div className="mt-5 h-4 border border-sglInk bg-slate-100" aria-label="Small Bags sell-through progress"><div className="h-full bg-sglAcid" style={{ width: overview.inventory.smallBags.progress.value === null ? "0%" : `${overview.inventory.smallBags.progress.value}%` }} /></div>
        <p className="mt-3 text-xs opacity-65">只有明确配置 Small Bags SKU 映射后才从 Website 库存表计算；缺少映射时保持 N/A。来源：{overview.inventory.smallBags.actual.sourceRef}。</p>
      </div>
      <div className="border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">Customers & CRM</h2><div className="mt-4 grid gap-4 sm:grid-cols-3 xl:grid-cols-1"><div><p className="text-xs font-black uppercase opacity-60">网站客户</p><p className="mt-1 text-2xl font-black">{display(overview.crm.websiteCustomers)}</p></div><div><p className="text-xs font-black uppercase opacity-60">今日新增</p><p className="mt-1 text-2xl font-black">{display(overview.crm.newCustomersToday)}</p></div><div><p className="text-xs font-black uppercase opacity-60">Retail 店家</p><p className="mt-1 text-2xl font-black">{display(overview.crm.retailPartners)}</p></div></div><p className="mt-4 text-[10px] opacity-60">Website 客户来自本地 PostgreSQL；Retail 数据只读自 Retail 投影。两套主数据不会复制或静默合并。</p></div>
    </section>

    <section><h2 className="mb-4 text-xl font-black uppercase">Agent Status</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{overview.agents.map(agent => <article key={`${agent.source}-${agent.label}`} className="border border-sglInk bg-white p-4"><div className="flex items-center justify-between gap-2"><p className="font-black uppercase">{agent.label}</p><StatusBadge status={agent.status} /></div><p className="mt-4 min-h-10 text-sm">{agent.detail}</p><p className="mt-3 text-[10px] opacity-60">来源：{agent.source} · 更新：{time(agent.updatedAt)}</p></article>)}</div></section>

    <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <div><h2 className="mb-4 text-xl font-black uppercase">Pending Actions</h2><div className="grid gap-3 sm:grid-cols-2">{overview.pending.length ? overview.pending.map(item => <Link key={item.key} href={item.href} className="flex items-center justify-between border border-sglInk bg-white p-4 hover:bg-sglAcid"><div><p className="font-black">{item.label}</p><p className="text-xs opacity-60">{item.source}</p></div><span className="text-3xl font-black">{item.count ?? "N/A"}</span></Link>) : <div className="border border-sglInk bg-white p-5 sm:col-span-2"><p className="font-black">Not Connected</p><p className="mt-1 text-sm opacity-60">Website 数据库未连接，无法读取待审批和人工跟进任务。</p></div>}</div></div>
      <div><h2 className="mb-4 text-xl font-black uppercase">System Exceptions</h2><div className="border border-sglInk bg-white">{overview.errors.length ? overview.errors.map(item => <div key={item.id} className="border-b border-sglInk/15 p-4 last:border-0"><div className="flex justify-between gap-3"><p className="font-black">{item.code}</p><StatusBadge status="error" /></div><p className="mt-1 text-xs opacity-60">{item.source} · {time(item.occurredAt)}</p></div>) : <p className="p-5 text-sm font-bold opacity-60">没有已记录的 Agent 失败事件；未连接来源不代表健康。</p>}</div></div>
    </section>

    <section><h2 className="mb-4 text-xl font-black uppercase">Recent Business Activity</h2><div className="border border-sglInk bg-white">{overview.activity.length ? overview.activity.map(item => <div key={item.id} className="grid gap-1 border-b border-sglInk/15 p-4 last:border-0 sm:grid-cols-[9rem_1fr_auto]"><p className="text-xs font-bold opacity-60">{time(item.occurredAt)}</p><p className="font-black">{item.label}</p><p className="text-xs font-bold uppercase">{item.source}</p></div>) : <p className="p-5 text-sm font-bold opacity-60">N/A · Website 审计数据未连接。</p>}</div></section>
  </div>;
}

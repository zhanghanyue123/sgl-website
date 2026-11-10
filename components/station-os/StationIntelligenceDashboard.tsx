import Link from "next/link";
import type { IntelligenceStatus, StationIntelligenceView } from "@/lib/station-intelligence/types";

function number(value: number | null, suffix = "") {
  return value === null ? "N/A" : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

function time(value: string | null) {
  if (!value) return "Not Recorded";
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) ? parsed.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : value;
}

function label(status: IntelligenceStatus | "recommendation") {
  return status.replaceAll("_", " ");
}

function Status({ value }: { value: IntelligenceStatus | "recommendation" }) {
  const good = value === "available";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${good ? "bg-[#d9ff43] text-[#17372d]" : "bg-[#ffe5d9] text-[#8b351b]"}`}>{label(value)}</span>;
}

function Metric({ label: metricLabel, value, detail }: { label: string; value: React.ReactNode; detail: string }) {
  return <article className="border border-[#17372d] bg-[#f7f5ed] p-5 shadow-[3px_3px_0_#17372d]">
    <p className="text-[10px] font-black uppercase tracking-[.18em] opacity-55">{metricLabel}</p>
    <p className="mt-3 text-3xl font-black">{value}</p>
    <p className="mt-2 text-xs leading-5 opacity-60">{detail}</p>
  </article>;
}

function Heading({ index, title, detail }: { index: string; title: string; detail: string }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#17372d] pb-3">
    <div className="flex items-end gap-3"><span className="font-mono text-xs opacity-40">{index}</span><h2 className="text-3xl font-black sm:text-4xl">{title}</h2></div>
    <p className="max-w-xl text-right text-xs opacity-55">{detail}</p>
  </div>;
}

export default function StationIntelligenceDashboard({ view }: { view: StationIntelligenceView }) {
  const sourceState: IntelligenceStatus = !view.connected ? "not_connected" : view.stale ? "stale" : "available";
  return <div className="min-h-screen bg-[#eef0e8] text-[#17372d]">
    <header className="border-b border-[#17372d] bg-[#17372d] px-5 py-6 text-[#f7f5ed] sm:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-5">
        <div><p className="text-[10px] font-black uppercase tracking-[.32em] text-[#d9ff43]">Station OS / Recommendation Only</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">Station Intelligence</h1><p className="mt-3 max-w-2xl text-sm opacity-70">Demand, preparation, workforce and replenishment evidence for manager review. No schedule, preparation, stock or purchase order is changed by this page.</p></div>
        <div className="text-right text-xs leading-5"><Status value={sourceState} /><p className="mt-2">Projection: {time(view.sourceReceivedAt)}</p><p>Analysis: {time(view.generatedAt)}</p></div>
      </div>
    </header>
    <nav className="border-b border-[#17372d] bg-[#f7f5ed] px-5 py-3 sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-wrap gap-2 text-xs font-black uppercase"><Link className="border border-[#17372d] px-3 py-2" href="/admin/station">← Station Operations</Link>{[["Overview", "overview"], ["Demand", "demand"], ["Preparation", "preparation"], ["Workforce", "workforce"], ["Materials", "materials"], ["Purchasing", "replenishment"], ["AI Activity", "activity"]].map(([name, id]) => <a className="border border-[#17372d]/30 px-3 py-2 hover:border-[#17372d]" href={`#${id}`} key={id}>{name}</a>)}</div></nav>
    <main className="mx-auto max-w-[1500px] space-y-12 px-5 py-8 sm:px-8">
      <section id="overview" className="scroll-mt-6"><Heading index="01" title="Overview" detail="Every metric carries a real source and timestamp. Missing inputs remain N/A." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Weather" value={view.weather.status === "available" ? number(view.weather.temperatureC, "°C") : "Not Connected"} detail={`${view.weather.source} · ${time(view.weather.observedAt)}`} />
          <Metric label="Forecast footfall" value={number(view.overview.forecastFootfall)} detail="Blocked until sufficient anonymous camera history exists" />
          <Metric label="Expected sales" value={number(view.overview.expectedSales)} detail="No forecast is inferred from a single dated sales report" />
          <Metric label="Staffing demand" value={number(view.overview.staffingDemand)} detail="Requires demand forecast plus availability" />
          <Metric label="Inventory risks" value={view.overview.inventoryRisks} detail="Real stock at or below recorded safety stock" />
          <Metric label="Pending approvals" value={view.overview.pendingApprovals} detail="No schedule or purchase approval workflow is enabled" />
        </div>
        {view.weather.alert && <div className="mt-4 border border-[#b94e2c] bg-[#fff0e8] p-4 text-sm font-bold">Weather alert: {view.weather.alert}</div>}
        <div className="mt-5 border border-[#17372d] bg-[#fff8cf] p-5"><p className="font-black">Data coverage</p><ul className="mt-2 grid gap-1 text-sm leading-6 md:grid-cols-2">{view.missingCapabilities.map((item) => <li key={item}>• {item}</li>)}</ul></div>
        <div className="mt-5"><h3 className="mb-3 text-xl font-black">AI Daily Briefing</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{view.dailyBriefing.map((item) => <article className="border border-[#17372d] bg-white/70 p-4" key={item.label}><div className="flex items-start justify-between gap-2"><p className="font-black">{item.label}</p><Status value={item.status} /></div><p className="mt-3 text-lg font-black">{item.value}</p><p className="mt-2 text-xs opacity-55">Source: {item.source}</p></article>)}</div></div>
      </section>

      <section id="demand" className="scroll-mt-6"><Heading index="02" title="Demand Forecast" detail="Next business day, 3-day and 7-day forecasts require aligned product-by-hour evidence." />
        <div className="mb-4 grid gap-3 md:grid-cols-4"><Metric label="Status" value={<Status value={view.demand.status} />} detail={view.demand.message} /><Metric label="Sales days in projection" value={view.demand.coverage.salesDays} detail="A dated report is evidence, not sufficient training history" /><Metric label="Footfall days in projection" value={view.demand.coverage.footfallDays} detail="Anonymous counts only" /><Metric label="Product rows" value={view.demand.coverage.productRows} detail="No missing SKU or product is invented" /></div>
        <div className="overflow-x-auto border border-[#17372d] bg-white/70"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["Product / Store", "Horizon", "Forecast quantity", "Confidence range", "Peak time", "Confidence", "Data sources", "Updated"].map((item) => <th className="p-3 text-xs uppercase" key={item}>{item}</th>)}</tr></thead><tbody>{view.demand.forecasts.map((item) => <tr className="border-t border-[#17372d]/15 align-top" key={item.id}><td className="p-3"><p className="font-black">{item.productId}</p><p className="text-xs opacity-55">{item.storeId}</p></td><td className="p-3">{item.horizon.replaceAll("_", " ")}</td><td className="p-3">{number(item.forecastQuantity)}</td><td className="p-3">{item.confidenceRange ? `${number(item.confidenceRange.low)}–${number(item.confidenceRange.high)}` : "N/A"}</td><td className="p-3">{item.expectedPeakTime || "N/A"}</td><td className="p-3"><span className="font-black">{item.confidence}</span><p className="mt-1 max-w-xs text-xs opacity-55">{item.periods.find((period) => period.reason)?.reason || "Evidence-backed estimate"}</p></td><td className="min-w-56 p-3 text-xs leading-5">{item.dataSources.map((source) => <p key={source.source}>{source.source}: {source.sourceRef} ({source.sampleCount})</p>)}</td><td className="p-3">{time(item.updatedAt)}</td></tr>)}</tbody></table>{!view.demand.forecasts.length && <p className="p-8 text-center text-sm opacity-60">Insufficient Data · no product forecast was generated from the current projection.</p>}</div>
        <p className="mt-3 text-xs opacity-60">Forecasts never substitute missing POS, weather, events, business hours or anonymous footfall with zero. Confidence and evidence are retained with each result.</p>
      </section>

      <section id="preparation" className="scroll-mt-6"><Heading index="03" title="Preparation Planner" detail="Formula: forecast + safety buffer − ready stock − in-progress stock. Waste is applied only after the net requirement." />
        <div className="mb-4"><Metric label="Status" value={<Status value={view.preparation.status} />} detail={view.preparation.message} /></div>
        <div className="overflow-x-auto border border-[#17372d] bg-white/70"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["Product", "Forecast + buffer", "Ready / in progress", "Net / gross prep", "Remaining / waste", "Expected stockout", "Batches", "Decision"].map((item) => <th className="p-3 text-xs uppercase" key={item}>{item}</th>)}</tr></thead><tbody>{view.preparation.plans.map((item) => <tr className="border-t border-[#17372d]/15 align-top" key={item.productId}><td className="p-3"><p className="font-black">{item.productName}</p><p className="font-mono text-[10px] opacity-50">{item.productId}</p></td><td className="p-3">{number(item.forecastQuantity)} + {number(item.safetyBuffer)}</td><td className="p-3">{number(item.readyStock)} / {number(item.inProgressStock)}</td><td className="p-3">{number(item.netPreparationRequirement)} / {number(item.suggestedGrossPreparation)}</td><td className="p-3">{number(item.expectedRemainingQuantity)} / {number(item.expectedWasteQuantity)}<p className="mt-1 text-xs opacity-55">Risk: {item.wasteRisk.replaceAll("_", " ")}</p></td><td className="p-3">{time(item.expectedStockoutAt)}</td><td className="min-w-52 p-3">{item.batches.length ? item.batches.map((batch) => <p key={batch.period}><span className="font-black">{batch.period}</span>: {batch.suggestedQuantity} · {batch.preparationMinutes} min · ready {time(batch.readyAt)}</p>) : "Not Recorded"}</td><td className="max-w-sm p-3"><Status value={item.status} /><ul className="mt-2 text-xs leading-5 opacity-65">{item.blockers.slice(0, 4).map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul>{item.blockers.length > 4 && <p className="mt-1 text-xs opacity-50">+ {item.blockers.length - 4} additional blockers</p>}</td></tr>)}</tbody></table>{!view.preparation.plans.length && <p className="p-8 text-center text-sm opacity-60">Not Recorded · no preparation quantity was inferred.</p>}</div>
        <p className="mt-3 text-xs opacity-60">Opening, morning, afternoon and evening batches remain recommendations. Manager approval is required and execution is disabled.</p>
      </section>

      <section id="workforce" className="scroll-mt-6"><Heading index="04" title="Workforce Planner" detail="Anonymous counts only. No face recognition, identity trail or audio is used." />
        <div className="mb-4 grid gap-3 md:grid-cols-4"><Metric label="Status" value={<Status value={view.workforce.status} />} detail={view.workforce.recommendation} /><Metric label="Shift gaps" value={view.workforce.shiftGaps} detail="Reported by the existing Station schedule" /><Metric label="Availability rows" value={view.workforce.availabilityRows} detail="Missing availability is not treated as available" /><Metric label="Backtest samples" value={view.workforce.backtest.sampleDays} detail={view.workforce.backtest.message} /></div>
        <div className="overflow-x-auto border border-[#17372d] bg-white/70"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["Hour", "Actual footfall", "Forecast", "Scheduled staff", "Recommended", "Gap", "Status"].map((item) => <th className="p-3 text-xs uppercase" key={item}>{item}</th>)}</tr></thead><tbody>{view.workforce.hourly.map((row) => <tr className="border-t border-[#17372d]/15" key={row.hour}><td className="p-3 font-black">{row.hour}</td><td className="p-3">{number(row.actualFootfall)}</td><td className="p-3">{number(row.forecastFootfall)}</td><td className="p-3">{number(row.scheduledStaff)}</td><td className="p-3">{number(row.recommendedStaff)}</td><td className="p-3">{number(row.gap)}</td><td className="p-3"><Status value={row.status} /></td></tr>)}</tbody></table>{!view.workforce.hourly.length && <p className="p-8 text-center text-sm opacity-60">Not Recorded · no hourly camera or schedule rows are available in the current projection.</p>}</div>
        <p className="mt-3 text-xs opacity-60">Draft schedule generation: Disabled. Owner or Manager approval and a verified availability data set are required before any Scheduling API call.</p>
      </section>

      <section id="materials" className="scroll-mt-6"><Heading index="05" title="Material Requirements" detail="Finished-product demand is converted only through a confirmed SKU and confirmed real BOM." />
        <div className="mb-4"><Metric label="Status" value={<Status value={view.materialRequirements.status} />} detail={view.materialRequirements.message} /></div>
        {view.materialRequirements.plan ? <div className="overflow-x-auto border border-[#17372d] bg-white/70"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["Material", "Required", "Current / reserved / incoming", "Shortage", "Reorder / suggested", "Supplier / MOQ", "Estimated arrival", "Draft"].map((item) => <th className="p-3 text-xs uppercase" key={item}>{item}</th>)}</tr></thead><tbody>{view.materialRequirements.plan.requirements.map((item) => <tr className="border-t border-[#17372d]/15" key={item.materialId}><td className="p-3 font-black">{item.name || item.materialId}</td><td className="p-3">{number(item.requiredQuantity)} {item.unit}</td><td className="p-3">{number(item.currentStock)} / {number(item.reservedStock)} / {number(item.incomingPurchase)}</td><td className="p-3">{number(item.shortage)}</td><td className="p-3">{number(item.reorderPoint)} / {number(item.suggestedPurchaseQuantity)}</td><td className="p-3">{item.supplier || "Not Recorded"} / {number(item.moq)}</td><td className="p-3">{item.estimatedArrival || "Not Recorded"}</td><td className="p-3">{item.purchaseDraft ? "Human approval required" : item.status.replaceAll("_", " ")}</td></tr>)}</tbody></table></div> : <div className="border border-[#17372d] bg-[#fff8cf] p-5"><p className="font-black">No BOM calculation was performed.</p><p className="mt-2 text-sm opacity-65">SKU confirmation, demand forecast and confirmed BOM are required. Missing inventory is not treated as zero.</p></div>}
        {view.materialRequirements.blockedProducts.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{view.materialRequirements.blockedProducts.map((item) => <div className="border border-[#17372d]/30 bg-white/60 p-3 text-sm" key={item.productId}><span className="font-black">{item.productId}</span><span className="opacity-60"> · {item.reason}</span></div>)}</div>}
      </section>

      <section id="replenishment" className="scroll-mt-6"><Heading index="06" title="Replenishment & Purchasing" detail="Current stock remains distinct from missing reserved, inbound and MOQ values." />
        <div className="overflow-x-auto border border-[#17372d] bg-white/70"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["Material", "Current / reserved / inbound", "Safety / usage", "Days left", "Suggested", "Supplier / MOQ", "Lead / arrival", "Decision"].map((item) => <th className="p-3 text-xs uppercase" key={item}>{item}</th>)}</tr></thead><tbody>{view.replenishment.recommendations.map((item) => <tr className="border-t border-[#17372d]/15 align-top" key={item.materialId}><td className="p-3"><p className="font-black">{item.name}</p><p className="font-mono text-[10px] opacity-50">{item.materialId}</p></td><td className="p-3">{number(item.currentStock)} / {number(item.reservedStock)} / {number(item.inboundStock)} {item.unit}</td><td className="p-3">{number(item.safetyStock)} / {number(item.averageDailyUsage)}</td><td className="p-3">{number(item.daysRemaining)}</td><td className="p-3">{number(item.suggestedQuantity)} {item.unit}</td><td className="p-3">{item.supplier || "Not Recorded"} / {number(item.moq)}</td><td className="p-3">{number(item.leadTimeDays, "d")} / {item.estimatedArrival || "Not Recorded"}</td><td className="max-w-sm p-3"><Status value={item.approvalState} /><ul className="mt-2 text-xs leading-5 opacity-65">{item.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul></td></tr>)}</tbody></table>{!view.replenishment.recommendations.length && <p className="p-8 text-center text-sm opacity-60">Not Recorded · no inventory quantity was inferred.</p>}</div>
        <p className="mt-3 text-xs opacity-60">Purchase draft generation: Disabled. Suggestions are not purchase orders and are never sent to suppliers.</p>
      </section>

      <section id="activity" className="scroll-mt-6"><Heading index="07" title="AI Activity & Accuracy" detail="Deterministic recommendation evidence; no autonomous write operation." />
        <div className="mb-5 grid gap-3 md:grid-cols-3"><Metric label="Forecast accuracy" value={view.forecastAccuracy.status} detail={view.forecastAccuracy.message} /><Metric label="Recorded weeks" value={view.forecastAccuracy.weeks.length} detail="Accuracy is never fabricated from sparse history" /><Metric label="Execution policy" value="Approval only" detail="No schedule, inventory, production or purchase write is automatic" /></div>
        <div className="grid gap-3 lg:grid-cols-3">{view.activity.map((item) => <article className="border border-[#17372d] bg-[#f7f5ed] p-5" key={item.id}><div className="flex items-center justify-between gap-3"><p className="font-black uppercase">{item.type}</p><span className="font-mono text-[10px] opacity-45">{item.id}</span></div><p className="mt-4 text-sm leading-6">{item.result}</p><p className="mt-3 text-xs font-black uppercase">{item.approvalState.replaceAll("_", " ")}</p><div className="mt-4 border-t border-[#17372d]/20 pt-3 text-xs leading-5 opacity-60">{item.evidence.map((source) => <p key={`${source.sourceRef}-${source.source}`}>{source.source}: {source.sourceRef} · {label(source.status)} · {time(source.observedAt)}</p>)}</div></article>)}</div>
      </section>
    </main>
  </div>;
}

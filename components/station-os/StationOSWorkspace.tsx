import Link from "next/link";
import StationOperationsEditor from "@/components/admin/StationOperationsEditor";

type Customer = { id: string; email: string; name: string; source: string; lastContactAt: string; status: string };
type Task = { id: string; customerId: string; source: string; type: string; title: string; summary: string; priority: string; status: string; createdAt: string; dueAt: string | null; completedAt: string | null };
type Command = { id: string; event_type: string; aggregate_id: string; status: string; attempts: number; last_error_code: string | null; created_at: string; delivered_at: string | null; failed_at: string | null };

type Props = {
  connected: boolean;
  stale: boolean;
  receivedAt: string | null;
  generatedAt: string | null;
  operations: Record<string, unknown>;
  customers: Customer[];
  tasks: Task[];
  commands: Command[];
  writable: boolean;
  operator: string;
};

function record(value: unknown): Record<string, any> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {}; }
function rows(value: unknown, key: string): Record<string, any>[] { const list = record(value)[key]; return Array.isArray(list) ? list.filter((row) => row && typeof row === "object") : []; }
function money(value: unknown) { const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 2 }).format(amount) : "N/A"; }
function number(value: unknown, suffix = "") { const amount = Number(value); return Number.isFinite(amount) ? `${amount}${suffix}` : "N/A"; }

const nav = [
  ["总览", "overview", "01"], ["小程序系统", "mini-system", "02"], ["商品与活动", "commerce", "03"], ["订单", "mini-orders", "04"],
  ["员工与权限", "workforce", "05"], ["库存", "inventory", "06"], ["采购", "procurement", "07"], ["排班", "schedule", "08"],
  ["产品经营", "products", "09"], ["客流", "camera", "10"], ["客户与任务", "customers", "11"]
] as const;

function Empty({ label }: { label: string }) { return <div className="border border-dashed border-[#315348]/35 bg-white/40 px-5 py-10 text-center text-sm text-[#315348]/60">{label}</div>; }
function StatusPill({ value }: { value: string }) { const good = ["normal", "active", "assigned", "completed", "delivered"].includes(value.toLowerCase()); return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${good ? "bg-[#d9ff43] text-[#17372d]" : "bg-[#ffe5d9] text-[#8b351b]"}`}>{value}</span>; }

export default function StationOSWorkspace(props: Props) {
  const inventory = record(props.operations.inventory);
  const materials = rows(inventory, "materials");
  const alerts = record(inventory.alerts);
  const purchase = record(props.operations.purchaseSuggestions);
  const shouldBuy = Array.isArray(purchase.shouldBuy) ? purchase.shouldBuy as Record<string, any>[] : [];
  const mustBuy = Array.isArray(purchase.mustBuy) ? purchase.mustBuy as Record<string, any>[] : [];
  const watch = Array.isArray(purchase.watch) ? purchase.watch as Record<string, any>[] : [];
  const staff = rows(props.operations.staff, "staff");
  const schedule = record(props.operations.schedule);
  const shifts = Array.isArray(schedule.shifts) ? schedule.shifts as Record<string, any>[] : [];
  const scheduleSummary = record(schedule.summary);
  const products = rows(props.operations.products, "products");
  const camera = record(props.operations.camera);
  const cameraRows = Array.isArray(camera.records) ? camera.records : [];
  const miniCatalog = record(props.operations.miniCatalog);
  const miniCatalogRows = Array.isArray(miniCatalog.items) ? miniCatalog.items as Record<string, any>[] : [];
  const miniOrders = record(props.operations.miniOrders);
  const miniOrderRows = Array.isArray(miniOrders.items) ? miniOrders.items as Record<string, any>[] : [];
  const miniSales = record(props.operations.miniSales);
  const openTasks = props.tasks.filter((task) => ["open", "in_progress"].includes(task.status));
  const health = !props.connected ? "未连接" : props.stale ? "数据过期" : "在线";

  return <div className="min-h-screen bg-[#eef0e8] text-[#17372d] lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="border-b border-[#17372d] bg-[#17372d] text-[#f5f1e6] lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="p-5 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-start justify-between gap-4 lg:block">
          <div><p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#d9ff43]">Seagull Labs</p><h1 className="mt-2 text-3xl font-black leading-none">Station OS</h1><p className="mt-2 text-xs opacity-55">门店经营工作台</p></div>
          <span className={`mt-1 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase ${props.connected && !props.stale ? "border-[#d9ff43] text-[#d9ff43]" : "border-[#ffb08a] text-[#ffb08a]"}`}><i className="h-2 w-2 rounded-full bg-current" />{health}</span>
        </div>
        <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">{nav.map(([label, id, count]) => <a key={id} href={`#${id}`} className="group flex items-center gap-3 border border-white/15 px-3 py-2.5 text-sm font-bold hover:border-[#d9ff43] hover:text-[#d9ff43]"><span className="font-mono text-[10px] opacity-40 group-hover:opacity-100">{count}</span>{label}</a>)}</nav>
        <div className="mt-6 border-t border-white/15 pt-5 text-xs leading-5 opacity-65"><p>操作员：{props.operator}</p><p>最近同步：{props.receivedAt ? new Date(props.receivedAt).toLocaleString("zh-CN") : "N/A"}</p></div>
        <Link href="/admin/station" className="mt-5 block border border-white/20 px-3 py-2 text-center text-xs font-black uppercase hover:border-[#d9ff43] hover:text-[#d9ff43]">连接器与权限 →</Link>
      </div>
    </aside>

    <main className="min-w-0">
      <header className="border-b border-[#17372d] bg-[#f7f5ed] px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] opacity-50">Operations / Shanghai</p><h2 className="mt-1 text-3xl font-black sm:text-5xl">今日门店运营</h2></div><div className="text-right text-xs"><p className="font-black">{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p><p className="mt-1 opacity-55">数据源：Station OS · {props.generatedAt ? new Date(props.generatedAt).toLocaleTimeString("zh-CN") : "N/A"}</p></div></div></header>
      <div className="mx-auto max-w-[1500px] space-y-12 px-5 py-7 sm:px-8 sm:py-10">
        <section id="overview" className="scroll-mt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[["库存物料", materials.length, "种"], ["库存预警", Number(alerts.red || 0) + Number(alerts.yellow || 0), "项"], ["待采购", mustBuy.length + shouldBuy.length, "项"], ["未覆盖班次", scheduleSummary.uncoveredCount ?? "N/A", "班"], ["待跟进任务", openTasks.length, "项"]].map(([label, value, suffix]) => <article key={String(label)} className="border border-[#17372d] bg-[#f7f5ed] p-5 shadow-[3px_3px_0_#17372d]"><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-55">{label}</p><p className="mt-4 text-4xl font-black">{value}<small className="ml-1 text-sm">{suffix}</small></p></article>)}
          </div>
          {!props.connected && <div className="mt-5 border border-[#b94e2c] bg-[#fff0e8] p-5 font-bold">Station 连接器尚未提交数据。工作台不会用演示数据替代真实经营数据。</div>}
        </section>

        <section id="mini-system" className="scroll-mt-6"><SectionTitle index="02" title="小程序系统" note="顾客端 · 员工端 · CloudBase · Station OS" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SystemCard title="顾客小程序" status="Source Ready" tone="good" detail="商品、订单、会员、积分、活动、社区、客服和 C25K 源码已存在；生产 CloudBase 版本仍需在线核验。" />
            <SystemCard title="员工小程序" status="Not Deployed" tone="warn" detail="打卡、排班、任务、订单处理和库存查询已开发；真实 AppID、CloudBase 与真机验收尚未完成。" />
            <SystemCard title="CloudBase 主数据" status={miniCatalogRows.length || miniOrderRows.length ? "Stale Mirror" : "Not Connected"} tone="warn" detail={`Station 镜像：${miniCatalogRows.length} 个商品、${miniOrderRows.length} 个订单；最后同步 ${formatSourceTime(miniCatalog.syncedAt || miniOrders.syncedAt)}。`} />
            <SystemCard title="腾讯云 Station OS" status={props.connected && !props.stale ? "Healthy" : props.stale ? "Stale" : "Not Connected"} tone={props.connected && !props.stale ? "good" : "warn"} detail="经营、库存、采购、员工、排班、客流、AI 分析与报告服务。" />
          </div>
          <div className="mt-4 border border-[#17372d] bg-[#fff8cf] p-4 text-sm leading-6"><strong>数据边界：</strong>CloudBase 是小程序商品、活动、订单、会员和考勤的主数据。网页目前展示 Station 的真实镜像；实时写回连接尚未完成，因此不会把网页修改伪装成小程序生产更新。</div>
        </section>

        <section id="commerce" className="scroll-mt-6"><SectionTitle index="03" title="小程序商品与活动" note={`CloudBase 镜像 · ${formatSourceTime(miniCatalog.syncedAt)}`} />
          <div className="grid gap-5 xl:grid-cols-[1.4fr_.7fr]"><div className="overflow-x-auto border border-[#17372d] bg-white/60"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["商品", "分类", "价格", "库存", "状态"].map((label) => <th key={label} className="p-3 text-xs uppercase">{label}</th>)}</tr></thead><tbody>{miniCatalogRows.slice(0, 100).map((item, index) => <tr key={String(item.productId || item.id || item._id || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{item.name || item.title || "未命名商品"}</td><td className="p-3">{item.category || item.type || "N/A"}</td><td className="p-3">{money(item.price ?? item.salePrice)}</td><td className="p-3">{number(item.stock ?? item.inventory)}</td><td className="p-3"><StatusPill value={item.soldOut ? "sold out" : item.available === false ? "offline" : "active"} /></td></tr>)}</tbody></table>{!miniCatalogRows.length && <Empty label="小程序商品镜像尚未连接" />}</div><div className="space-y-3"><SystemCard title="商品编辑" status="Bridge Required" tone="warn" detail="原小程序后台已有图片、价格、库存、安全库存、规格、排序、上下架和售罄编辑；需通过 CloudBase BFF 写回，不能直接改镜像 JSON。" /><SystemCard title="活动管理" status="Not Connected" tone="warn" detail="活动创建、状态、报名和签到源码存在；网页尚未取得 CloudBase 实时活动集合。" /><SystemCard title="内容与品牌" status="Partial" tone="warn" detail="菜单、Station、社区和活动内容分散在 CloudBase 与小程序资源中，需建立统一内容发布契约。" /></div></div>
        </section>

        <section id="mini-orders" className="scroll-mt-6"><SectionTitle index="04" title="小程序订单" note={`只读镜像 · ${formatSourceTime(miniOrders.syncedAt)}`} />
          <div className="mb-3 grid gap-3 sm:grid-cols-3"><MetricCard label="镜像订单" value={String(miniOrderRows.length)} /><MetricCard label="同步销售日期" value={String(miniSales.dateCount ?? "N/A")} /><MetricCard label="数据状态" value={miniOrderRows.length ? "Stale" : "Not Connected"} /></div>
          <div className="overflow-x-auto border border-[#17372d] bg-white/60"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["订单", "时间", "金额", "支付", "履约"].map((label) => <th key={label} className="p-3 text-xs uppercase">{label}</th>)}</tr></thead><tbody>{miniOrderRows.slice(0, 100).map((item, index) => <tr key={String(item.orderId || item.orderNo || item.id || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-mono text-xs">{item.orderNo || item.orderId || item.id || "N/A"}</td><td className="p-3">{formatSourceTime(item.createdAt || item.paidAt)}</td><td className="p-3 font-black">{money(item.payableTotal ?? item.totalAmount ?? item.amount)}</td><td className="p-3"><StatusPill value={String(item.paymentStatus || item.status || "unknown")} /></td><td className="p-3">{item.fulfillmentStatus || "N/A"}</td></tr>)}</tbody></table>{!miniOrderRows.length && <Empty label="小程序订单镜像尚未连接" />}</div>
          <p className="mt-3 text-xs opacity-55">订单、支付和退款的财务状态保持原系统管理；本页面不提供绕过支付审核的修改入口。</p>
        </section>

        <section id="workforce" className="scroll-mt-6"><SectionTitle index="05" title="员工、考勤、工资与权限" note="员工小程序与 Station 排班能力审计" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><SystemCard title="员工账号与门店权限" status="Source Ready" tone="good" detail="已有 owner / manager / staff、一次性邀请、解绑、停用、转移、门店 scope 和审计。生产 CloudBase 未验收。" /><SystemCard title="打卡与考勤" status="Awaiting Staff App" tone="warn" detail="已有可信微信身份、定位、规则、幂等回执、上下班和撤销审计；员工独立小程序尚未部署。" /><SystemCard title="工资核算" status="Incomplete" tone="warn" detail="已有时薪、工时和月度工资界面；当前云函数不能保证每条考勤记录生成可靠工资，不能作为工资结算账本。" /><SystemCard title="AI 排班" status={shifts.length ? "Station Available" : "Not Connected"} tone={shifts.length ? "good" : "warn"} detail={`Station 已返回 ${shifts.length} 个班次和 ${number(scheduleSummary.uncoveredCount)} 个未覆盖班次；发布到员工小程序的双向桥接尚未完成。`} /></div>
        </section>

        <section id="inventory" className="scroll-mt-6"><SectionTitle index="06" title="库存" note="实时库存、安全库存与日均用量" />
          {materials.length ? <div className="grid gap-3 lg:grid-cols-3">{materials.map((item) => { const low = Number(item.currentStock) <= Number(item.safetyStock); return <article key={String(item.materialId || item.name)} className={`border p-5 ${low ? "border-[#b94e2c] bg-[#fff0e8]" : "border-[#17372d] bg-white/60"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase opacity-50">{item.category || "物料"}</p><h3 className="mt-1 text-xl font-black">{item.name}</h3></div><StatusPill value={low ? "low stock" : "normal"} /></div><div className="mt-6 grid grid-cols-3 gap-2 text-sm"><Metric label="当前" value={number(item.currentStock, item.unit ? ` ${item.unit}` : "")} /><Metric label="安全" value={number(item.safetyStock, item.unit ? ` ${item.unit}` : "")} /><Metric label="日均" value={number(item.avgDailyUsage)} /></div><p className="mt-4 text-xs opacity-55">供应商：{item.supplier || "N/A"}</p></article>})}</div> : <Empty label="暂无库存数据" />}
        </section>

        <section id="procurement" className="scroll-mt-6"><SectionTitle index="07" title="采购" note={`预计采购金额 ${money(purchase.totalEstimatedCost)}`} />
          <div className="grid gap-4 xl:grid-cols-2"><ProcurementColumn title="建议采购" rows={[...mustBuy, ...shouldBuy]} empty="当前没有紧急采购项" /><ProcurementColumn title="持续观察" rows={watch} empty="当前没有观察项" /></div>
        </section>

        <section id="schedule" className="scroll-mt-6"><SectionTitle index="08" title="Station 排班" note={`${staff.length} 位员工 · ${shifts.length} 个班次`} />
          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]"><div className="space-y-3">{staff.map((person) => <article key={String(person.staffId || person.name)} className="border border-[#17372d] bg-white/60 p-4"><div className="flex items-center justify-between"><div><h3 className="font-black">{person.name}</h3><p className="text-xs opacity-55">{person.role} · {Array.isArray(person.skills) ? person.skills.join(" / ") : ""}</p></div><StatusPill value={person.active ? "active" : "inactive"} /></div><p className="mt-3 text-xs">每周 {number(person.minHoursPerWeek)}–{number(person.maxHoursPerWeek)} 小时</p></article>)}{!staff.length && <Empty label="暂无员工数据" />}</div><div className="overflow-x-auto border border-[#17372d] bg-white/60"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{["日期", "时间", "岗位", "员工", "工时", "状态"].map((label) => <th key={label} className="p-3 text-xs uppercase">{label}</th>)}</tr></thead><tbody>{shifts.map((shift, index) => <tr key={`${shift.date}-${shift.start}-${index}`} className="border-t border-[#17372d]/15"><td className="p-3 font-bold">{shift.date}</td><td className="p-3">{shift.start}–{shift.end}</td><td className="p-3">{shift.role}</td><td className="p-3">{shift.name || "待安排"}</td><td className="p-3">{number(shift.hours, "h")}</td><td className="p-3"><StatusPill value={shift.status || "uncovered"} /></td></tr>)}</tbody></table>{!shifts.length && <Empty label="暂无排班数据" />}</div></div>
        </section>

        <section id="products" className="scroll-mt-6"><SectionTitle index="09" title="产品经营" note="Station 售价、成本与毛利" />
          {products.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <article key={String(product.productId || product.name)} className="border border-[#17372d] bg-[#f7f5ed] p-5"><p className="text-xs font-black uppercase opacity-50">{product.category}</p><h3 className="mt-2 text-2xl font-black">{product.name}</h3><div className="mt-6 grid grid-cols-3 gap-2"><Metric label="售价" value={money(product.price)} /><Metric label="成本" value={money(product.variableCost)} /><Metric label="毛利率" value={number(product.grossMargin, "%")} /></div><div className="mt-5 flex items-center justify-between"><span className="text-xs">{product.strategicRole || "常规产品"}</span><StatusPill value={product.active ? "active" : "inactive"} /></div></article>)}</div> : <Empty label="暂无产品数据" />}
        </section>

        <section id="camera" className="scroll-mt-6"><SectionTitle index="10" title="客流与摄像头" note="仅显示脱敏汇总，不展示原始影像" /><div className="border border-[#17372d] bg-[#17372d] p-7 text-[#f7f5ed]"><p className="text-5xl font-black text-[#d9ff43]">{cameraRows.length}</p><p className="mt-2 font-black">今日客流记录</p><p className="mt-4 max-w-xl text-sm leading-6 opacity-60">摄像头尚未接入时保持为 0，不推测人流、动线或排班结论。接入后可在这里查看按小时客流、区域停留与排班建议。</p></div></section>

        <section id="customers" className="scroll-mt-6"><SectionTitle index="11" title="客户与人工任务" note="此模块支持受控编辑；保存后由 Station 连接器执行并确认" /><StationOperationsEditor customers={props.customers} tasks={props.tasks} commands={props.commands} writable={props.writable} /></section>
      </div>
    </main>
  </div>;
}

function SectionTitle({ index, title, note }: { index: string; title: string; note: string }) { return <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#17372d] pb-3"><div className="flex items-end gap-3"><span className="font-mono text-xs opacity-40">{index}</span><h2 className="text-3xl font-black sm:text-4xl">{title}</h2></div><p className="text-xs opacity-55">{note}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-black uppercase opacity-45">{label}</p><p className="mt-1 font-black">{value}</p></div>; }
function MetricCard({ label, value }: { label: string; value: string }) { return <div className="border border-[#17372d] bg-[#f7f5ed] p-4"><p className="text-[10px] font-black uppercase tracking-wider opacity-50">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function SystemCard({ title, status, tone, detail }: { title: string; status: string; tone: "good" | "warn"; detail: string }) { return <article className="border border-[#17372d] bg-[#f7f5ed] p-5"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-black">{title}</h3><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${tone === "good" ? "bg-[#d9ff43]" : "bg-[#ffe5d9] text-[#8b351b]"}`}>{status}</span></div><p className="mt-4 text-xs leading-5 opacity-65">{detail}</p></article>; }
function formatSourceTime(value: unknown) { if (typeof value !== "string" && typeof value !== "number") return "N/A"; const date = new Date(value); return Number.isFinite(date.valueOf()) ? date.toLocaleString("zh-CN") : "N/A"; }
function ProcurementColumn({ title, rows: items, empty }: { title: string; rows: Record<string, any>[]; empty: string }) { return <div><h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em]">{title}</h3><div className="space-y-3">{items.map((item, index) => <article key={String(item.materialId || item.name || index)} className="border border-[#17372d] bg-white/60 p-4"><div className="flex items-start justify-between gap-4"><div><h4 className="font-black">{item.name}</h4><p className="mt-1 text-xs leading-5 opacity-60">{item.reason || "依据库存与交期计算"}</p></div><StatusPill value={item.priority || "watch"} /></div><div className="mt-4 grid grid-cols-3 gap-3 text-sm"><Metric label="剩余天数" value={number(item.daysRemaining, " 天")} /><Metric label="建议数量" value={number(item.suggestedPurchaseQty, item.unit ? ` ${item.unit}` : "")} /><Metric label="预计成本" value={money(item.estimatedCost)} /></div></article>)}{!items.length && <Empty label={empty} />}</div></div>; }

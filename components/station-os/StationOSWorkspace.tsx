import Link from "next/link";

type Customer = { id: string; email: string; name: string; source: string; lastContactAt: string; status: string };
type Task = { id: string; customerId: string; source: string; type: string; title: string; summary: string; priority: string; status: string; createdAt: string; dueAt: string | null; completedAt: string | null };
type Command = { id: string; event_type: string; aggregate_id: string; status: string; attempts: number; last_error_code: string | null; created_at: string; delivered_at: string | null; failed_at: string | null };
type Props = { connected: boolean; stale: boolean; error: string | null; receivedAt: string | null; generatedAt: string | null; operations: Record<string, unknown>; customers: Customer[]; tasks: Task[]; commands: Command[]; writable: boolean; operator: string };
type Row = Record<string, any>;

const nav = [
  ["Store Dashboard", "dashboard"], ["POS & Sales", "pos-sales"], ["Products & Menu", "products-menu"],
  ["Inventory", "inventory"], ["BOM & Recipes", "bom-recipes"], ["Purchasing", "purchasing"],
  ["Suppliers", "suppliers"], ["Staff", "staff"], ["Attendance", "attendance"],
  ["Scheduling", "scheduling"], ["Reports", "reports"], ["Settings", "settings"],
] as const;

const capabilities = [
  ["Products & Menu", "GET + POST upsert", "真实读写 API；生产写连接尚未授权"],
  ["Inventory", "GET + controlled POST", "可读取状态/流水；消耗与日结属于高风险写操作"],
  ["BOM & Recipes", "GET + POST upsert", "路由冲突修复前 /ops/bom/list 不可用"],
  ["Purchasing", "GET + POST add", "可读采购记录；新增需专用写权限"],
  ["Staff", "GET + POST upsert", "可读员工；写入尚未开放到网页"],
  ["Scheduling", "GET + POST generate", "可读周排班；生成操作尚未开放到网页"],
  ["POS & Sales", "POST sync only", "没有 POS 查询/退款 CRUD，网页保持只读"],
  ["Attendance", "Not Available", "未发现独立考勤 API"],
  ["Suppliers", "Not Available", "供应商仅存在于物料字段，未发现独立 CRUD"],
  ["Settings", "Not Available", "未发现门店设置 CRUD"],
] as const;

function record(value: unknown): Row { return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {}; }
function list(value: unknown, key?: string): Row[] { const candidate = key ? record(value)[key] : value; return Array.isArray(candidate) ? candidate.filter((row): row is Row => Boolean(row && typeof row === "object")) : []; }
function money(value: unknown) { const amount = Number(value); return Number.isFinite(amount) ? new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(amount) : "N/A"; }
function count(value: unknown) { const amount = Number(value); return Number.isFinite(amount) ? String(amount) : "N/A"; }
function dateTime(value: unknown) { if (typeof value !== "string" && typeof value !== "number") return "N/A"; const date = new Date(value); return Number.isFinite(date.valueOf()) ? date.toLocaleString("zh-CN") : "N/A"; }
function SectionTitle({ index, title, note }: { index: string; title: string; note: string }) { return <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#17372d] pb-3"><div className="flex items-end gap-3"><span className="font-mono text-xs opacity-40">{index}</span><h2 className="text-3xl font-black sm:text-4xl">{title}</h2></div><p className="text-xs opacity-55">{note}</p></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="border border-dashed border-[#315348]/35 bg-white/40 px-5 py-9 text-center text-sm text-[#315348]/65">{children}</div>; }
function Pill({ children, good = false }: { children: React.ReactNode; good?: boolean }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${good ? "bg-[#d9ff43] text-[#17372d]" : "bg-[#ffe5d9] text-[#8b351b]"}`}>{children}</span>; }
function Metric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) { return <article className="border border-[#17372d] bg-[#f7f5ed] p-5 shadow-[3px_3px_0_#17372d]"><p className="text-[10px] font-black uppercase tracking-[.18em] opacity-55">{label}</p><p className="mt-3 text-3xl font-black">{value}</p>{detail && <p className="mt-2 text-xs opacity-55">{detail}</p>}</article>; }
function Table({ headings, children, empty }: { headings: string[]; children: React.ReactNode; empty: boolean }) { return <div className="overflow-x-auto border border-[#17372d] bg-white/60"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr>{headings.map((heading) => <th key={heading} className="p-3 text-xs uppercase">{heading}</th>)}</tr></thead><tbody>{children}</tbody></table>{empty && <Empty>暂无来自 Station OS 的真实数据。</Empty>}</div>; }
function RowStatus({ value }: { value: unknown }) { const text = String(value ?? "unknown"); return <Pill good={["active", "normal", "completed", "delivered", "paid"].includes(text.toLowerCase())}>{text}</Pill>; }

export default function StationOSWorkspace(props: Props) {
  const inventory = record(props.operations.inventory);
  const materials = list(inventory, "materials");
  const inventoryLedger = list(record(props.operations.inventoryLedger), "entries");
  const products = list(props.operations.products, "products");
  const bom = list(props.operations.bom, "bom");
  const purchases = list(props.operations.purchases, "purchases");
  const purchaseSuggestions = record(props.operations.purchaseSuggestions);
  const purchaseQueue = [...list(purchaseSuggestions.mustBuy), ...list(purchaseSuggestions.shouldBuy)];
  const staff = list(props.operations.staff, "staff");
  const availability = list(props.operations.availability, "availability");
  const schedule = record(props.operations.schedule);
  const shifts = list(schedule.shifts);
  const daily = record(props.operations.daily);
  const orders = list(record(props.operations.miniOrders).items);
  const openTasks = props.tasks.filter((task) => ["open", "in_progress"].includes(task.status));
  const state = props.error ? "Error" : !props.connected ? "Not Connected" : props.stale ? "Stale" : "Connected";
  const healthy = state === "Connected";

  return <div className="min-h-screen bg-[#eef0e8] text-[#17372d] lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="border-b border-[#17372d] bg-[#17372d] text-[#f5f1e6] lg:min-h-screen lg:border-b-0 lg:border-r"><div className="p-5 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
      <p className="text-[10px] font-black uppercase tracking-[.34em] text-[#d9ff43]">Seagull Labs</p><h1 className="mt-2 text-3xl font-black">Station OS Admin</h1><p className="mt-2 text-xs opacity-55">独立门店运营后台</p><div className="mt-4"><Pill good={healthy}>{state}</Pill></div>
      <nav aria-label="Station OS Admin" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">{nav.map(([label, id], index) => <a key={id} href={`#${id}`} className="flex items-center gap-3 border border-white/15 px-3 py-2.5 text-xs font-bold hover:border-[#d9ff43] hover:text-[#d9ff43]"><span className="font-mono opacity-40">{String(index + 1).padStart(2, "0")}</span>{label}</a>)}</nav>
      <Link href="/admin/station/intelligence" className="mt-6 block border border-[#d9ff43] px-3 py-2 text-center text-xs font-black uppercase text-[#d9ff43] hover:bg-[#d9ff43] hover:text-[#17372d]">Station Intelligence →</Link>
      <div className="mt-6 border-t border-white/15 pt-4 text-xs leading-5 opacity-65"><p>Operator: {props.operator}</p><p>Updated: {dateTime(props.receivedAt)}</p></div><Link href="/admin" className="mt-5 block border border-white/20 px-3 py-2 text-center text-xs font-black uppercase hover:border-[#d9ff43] hover:text-[#d9ff43]">← Website Admin</Link>
    </div></aside>
    <main className="min-w-0"><header className="border-b border-[#17372d] bg-[#f7f5ed] px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.25em] opacity-50">Shanghai Station / Production Projection</p><h2 className="mt-1 text-3xl font-black sm:text-5xl">门店运营系统</h2></div><div className="text-right text-xs"><p className="font-black">Source: Tencent Cloud Station OS</p><p className="mt-1 opacity-55">Generated {dateTime(props.generatedAt)}</p></div></div></header>
      <div className="mx-auto max-w-[1500px] space-y-12 px-5 py-7 sm:px-8 sm:py-10">
        <section id="dashboard" className="scroll-mt-6"><SectionTitle index="01" title="Store Dashboard" note="门店经营总览与待办" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Products" value={products.length} /><Metric label="Materials" value={materials.length} /><Metric label="Purchasing" value={purchases.length || purchaseQueue.length} /><Metric label="Staff" value={staff.length} /><Metric label="Open tasks" value={openTasks.length} /></div>{state !== "Connected" && <div className="mt-5 border border-[#b94e2c] bg-[#fff0e8] p-5 font-bold">Station OS: {state}. 页面不会使用模拟数据替代生产数据。{props.error ? ` Error: ${props.error}` : ""}</div>}<div className="mt-5 border border-[#17372d] bg-[#fff8cf] p-4 text-sm leading-6"><strong>数据边界：</strong>Website Admin 管理网站商品、SKU、订单、支付和退款；这里展示门店 POS、原料、BOM、采购、员工和排班，不合并两套库存数字。</div></section>

        <section id="pos-sales" className="scroll-mt-6"><SectionTitle index="02" title="POS & Sales" note="当前仅有订单同步写接口，没有 POS 查询 CRUD" /><div className="mb-4 grid gap-3 md:grid-cols-3"><Metric label="Sales date" value={daily.date || "N/A"} /><Metric label="Revenue" value={money(daily.revenue ?? daily.sales)} /><Metric label="Mirrored orders" value={orders.length} /></div><Table headings={["Order", "Time", "Amount", "Payment", "Fulfillment"]} empty={!orders.length}>{orders.slice(0, 100).map((order, index) => <tr key={String(order.orderId || order.id || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-mono text-xs">{order.orderNo || order.orderId || order.id || "N/A"}</td><td className="p-3">{dateTime(order.createdAt || order.paidAt)}</td><td className="p-3 font-black">{money(order.totalAmount ?? order.amount)}</td><td className="p-3"><RowStatus value={order.paymentStatus || order.status} /></td><td className="p-3">{order.fulfillmentStatus || "N/A"}</td></tr>)}</Table><p className="mt-3 text-xs opacity-60">Read Only · 退款和支付仍由 Website Admin 的既有流程管理。</p></section>

        <section id="products-menu" className="scroll-mt-6"><SectionTitle index="03" title="Products & Menu" note="/ops/products/list · /ops/products/upsert" /><Table headings={["Product", "Category", "Price", "Cost", "Status"]} empty={!products.length}>{products.map((product, index) => <tr key={String(product.productId || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{product.name || product.productId || "N/A"}</td><td className="p-3">{product.category || "N/A"}</td><td className="p-3">{money(product.price)}</td><td className="p-3">{money(product.variableCost)}</td><td className="p-3"><RowStatus value={product.active === false ? "inactive" : "active"} /></td></tr>)}</Table><p className="mt-3 text-xs opacity-60">{props.writable ? "Write enabled through audited BFF." : "Read Only · Station 专用写凭证尚未启用，页面不显示无效保存按钮。"}</p></section>

        <section id="inventory" className="scroll-mt-6"><SectionTitle index="04" title="Inventory" note="库存状态、流水和受控消耗" /><Table headings={["Material", "Current", "Safety", "Daily usage", "Supplier"]} empty={!materials.length}>{materials.map((item, index) => <tr key={String(item.materialId || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{item.name || item.materialId}</td><td className="p-3">{count(item.currentStock)} {item.unit}</td><td className="p-3">{count(item.safetyStock)} {item.unit}</td><td className="p-3">{count(item.avgDailyUsage)}</td><td className="p-3">{item.supplier || "N/A"}</td></tr>)}</Table><p className="mt-3 text-xs opacity-60">Ledger rows: {inventoryLedger.length}. 入库、出库、盘点和库存调整在后端缺少完整独立 CRUD 前保持 Read Only。</p></section>

        <section id="bom-recipes" className="scroll-mt-6"><SectionTitle index="05" title="BOM & Recipes" note="配方、原料用量和成本" /><Table headings={["Product", "Material", "Quantity", "Unit", "Status"]} empty={!bom.length}>{bom.map((row, index) => <tr key={`${row.productId || "product"}-${row.materialId || index}`} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{row.productName || row.productId || "N/A"}</td><td className="p-3">{row.materialName || row.materialId || "N/A"}</td><td className="p-3">{count(row.quantity)}</td><td className="p-3">{row.unit || "N/A"}</td><td className="p-3"><Pill>{props.error ? "Error" : "Read Only"}</Pill></td></tr>)}</Table><p className="mt-3 text-xs opacity-60">Read Only · `/ops/bom/list` 路由冲突修复并完成生产验收后再开放写入。</p></section>

        <section id="purchasing" className="scroll-mt-6"><SectionTitle index="06" title="Purchasing" note="采购记录与库存建议" /><Table headings={["Material", "Quantity", "Cost", "Status", "Reason"]} empty={!purchases.length && !purchaseQueue.length}>{[...purchases, ...purchaseQueue].slice(0, 100).map((row, index) => <tr key={String(row.purchaseId || row.materialId || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{row.name || row.materialName || row.materialId || "N/A"}</td><td className="p-3">{count(row.quantity ?? row.suggestedPurchaseQty)} {row.unit}</td><td className="p-3">{money(row.cost ?? row.estimatedCost)}</td><td className="p-3"><RowStatus value={row.status || row.priority || "suggested"} /></td><td className="p-3 max-w-sm">{row.reason || "N/A"}</td></tr>)}</Table><p className="mt-3 text-xs opacity-60">Read Only · 新建采购单需 station:purchasing 写权限和生产写连接。</p></section>

        <section id="suppliers" className="scroll-mt-6"><SectionTitle index="07" title="Suppliers" note="供应商主数据" /><Empty>Not Available · 当前 Station OS 没有独立 Suppliers CRUD。供应商名称仅作为物料字段展示。</Empty></section>
        <section id="staff" className="scroll-mt-6"><SectionTitle index="08" title="Staff" note="/ops/staff/list · /ops/staff/upsert" /><Table headings={["Name", "Role", "Skills", "Weekly hours", "Status"]} empty={!staff.length}>{staff.map((person, index) => <tr key={String(person.staffId || index)} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{person.name || person.staffId}</td><td className="p-3">{person.role || "N/A"}</td><td className="p-3">{Array.isArray(person.skills) ? person.skills.join(" / ") : "N/A"}</td><td className="p-3">{count(person.minHoursPerWeek)}–{count(person.maxHoursPerWeek)}</td><td className="p-3"><RowStatus value={person.active === false ? "inactive" : "active"} /></td></tr>)}</Table><p className="mt-3 text-xs opacity-60">{props.writable ? "Write enabled through audited BFF." : "Read Only · 网页写回尚未授权。"}</p></section>
        <section id="attendance" className="scroll-mt-6"><SectionTitle index="09" title="Attendance" note="员工打卡与考勤" /><Empty>Not Available · 当前 Station OS OpenAPI 未发现独立 Attendance API。已同步 availability 记录 {availability.length} 条，但不能将其冒充真实打卡记录。</Empty></section>
        <section id="scheduling" className="scroll-mt-6"><SectionTitle index="10" title="Scheduling" note="周排班与工时" /><Table headings={["Date", "Time", "Role", "Staff", "Hours", "Status"]} empty={!shifts.length}>{shifts.map((shift, index) => <tr key={`${shift.date || "date"}-${index}`} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{shift.date || "N/A"}</td><td className="p-3">{shift.start || "N/A"}–{shift.end || "N/A"}</td><td className="p-3">{shift.role || "N/A"}</td><td className="p-3">{shift.name || "待安排"}</td><td className="p-3">{count(shift.hours)}</td><td className="p-3"><RowStatus value={shift.status || "uncovered"} /></td></tr>)}</Table><p className="mt-3 text-xs opacity-60">Read Only · 自动生成排班属于 station:schedule 写操作，尚未开放到网页。</p></section>

        <section id="reports" className="scroll-mt-6"><SectionTitle index="11" title="Reports" note="日报、周报和经营数据" /><div className="grid gap-3 md:grid-cols-3"><Metric label="Report date" value={daily.date || "N/A"} /><Metric label="Revenue" value={money(daily.revenue ?? daily.sales)} /><Metric label="Tasks" value={props.tasks.length} detail={`${openTasks.length} open`} /></div><div className="mt-4 border border-[#17372d] bg-white/60 p-5 text-sm leading-6">日报数据存在时按 Station OS 原值显示；缺失字段保持 N/A，不推算未提供的销售额、成本或利润。</div></section>

        <section id="settings" className="scroll-mt-6"><SectionTitle index="12" title="Settings" note="连接、权限、审计和 API 能力" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Connection" value={state} /><Metric label="Write mode" value={props.writable ? "Enabled" : "Read Only"} /><Metric label="Projection received" value={dateTime(props.receivedAt)} /><Metric label="Audit commands" value={props.commands.length} /></div><div className="mt-5 overflow-x-auto border border-[#17372d] bg-white/60"><table className="min-w-full text-left text-sm"><thead className="bg-[#17372d] text-[#f7f5ed]"><tr><th className="p-3">Module</th><th className="p-3">Station API</th><th className="p-3">Web status</th></tr></thead><tbody>{capabilities.map(([module, api, status]) => <tr key={module} className="border-t border-[#17372d]/15"><td className="p-3 font-black">{module}</td><td className="p-3 font-mono text-xs">{api}</td><td className="p-3">{status}</td></tr>)}</tbody></table></div><p className="mt-4 text-xs opacity-60">RBAC 通过服务端校验；浏览器不接收 Station Token。所有未来写操作必须保存后重新读取，并写入审计记录。</p></section>
      </div>
    </main>
  </div>;
}

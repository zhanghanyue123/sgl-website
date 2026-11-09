import Link from "next/link";
import type { AgentId, AgentMetric, AgentOperationalStatus, AgentOperations, AgentSnapshot } from "@/lib/admin/agent-operations";

const statusCopy: Record<AgentOperationalStatus, string> = {
  running: "Running", healthy: "Healthy", degraded: "Degraded", error: "Error",
  not_connected: "Not Connected", not_deployed: "Not Deployed", stale: "Stale"
};
const statusStyle: Record<AgentOperationalStatus, string> = {
  running: "border-blue-800 bg-blue-50 text-blue-900", healthy: "border-emerald-800 bg-emerald-50 text-emerald-900",
  degraded: "border-amber-700 bg-amber-50 text-amber-900", error: "border-red-700 bg-red-50 text-red-900",
  not_connected: "border-slate-400 bg-slate-100 text-slate-700", not_deployed: "border-slate-700 bg-slate-200 text-slate-900",
  stale: "border-orange-700 bg-orange-50 text-orange-900"
};
const agentLinks: Record<AgentId, string> = { retail: "/admin/agents/retail", hello: "/admin/agents/hello", fries: "/admin/agents/fries" };

function StatusBadge({ status }: { status: AgentOperationalStatus }) {
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyle[status]}`}>{statusCopy[status]}</span>;
}

function time(value: string | null, timezone: string) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short", timeZone: timezone }).format(new Date(value));
}

function metricValue(metric: AgentMetric) {
  if (metric.value === null) return metric.status === "not_deployed" ? "Not Deployed" : metric.status === "not_connected" ? "Not Connected" : "N/A";
  return new Intl.NumberFormat("en-US").format(metric.value);
}

function AgentSummary({ agent, timezone }: { agent: AgentSnapshot; timezone: string }) {
  const fields = [
    ["Connection Status", agent.connectionStatus.replaceAll("_", " ")], ["Runtime Status", agent.runtimeStatus],
    ["Last Execution", time(agent.lastExecution, timezone)], ["Last Successful", time(agent.lastSuccessfulExecution, timezone)],
    ["Next Scheduled Run", time(agent.nextScheduledRun, timezone)], ["Tasks Completed", agent.tasksCompleted ?? "N/A"],
    ["Errors", agent.errors ?? "N/A"], ["Pending Actions", agent.pendingActions ?? "N/A"]
  ];
  return <article className="border border-sglInk bg-white p-5 shadow-[4px_4px_0_#111]">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.2em] opacity-55">{agent.id}</p><h2 className="mt-1 text-2xl font-black uppercase">{agent.name}</h2></div><StatusBadge status={agent.operationalStatus} /></div>
    <dl className="mt-5 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">{fields.map(([label, value]) => <div key={String(label)}><dt className="text-[10px] font-black uppercase tracking-wide opacity-55">{label}</dt><dd className="mt-0.5 break-words font-bold capitalize">{String(value)}</dd></div>)}</dl>
    <p className="mt-5 border-t border-sglInk/15 pt-3 text-[10px] leading-4 opacity-60">来源：{agent.source}<br />更新：{time(agent.lastUpdated, timezone)}<br />{agent.sourceDetail}</p>
    <Link href={agentLinks[agent.id]} className="mt-4 inline-flex border border-sglInk bg-sglAcid px-3 py-2 text-xs font-black uppercase">查看详情 →</Link>
  </article>;
}

function Metrics({ agent, timezone }: { agent: AgentSnapshot; timezone: string }) {
  return <section><h2 className="mb-4 text-xl font-black uppercase">Business Metrics</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{agent.metrics.map(metric => <article key={metric.key} className="border border-sglInk bg-white p-4"><p className="text-xs font-black uppercase tracking-wide opacity-60">{metric.label}</p><p className="mt-3 break-words text-2xl font-black">{metricValue(metric)}</p><p className="mt-3 text-[10px] opacity-55">{metric.source}<br />{time(metric.updatedAt, timezone)}</p></article>)}</div></section>;
}

function RetailPolicy() {
  return <section className="border border-sglInk bg-sglAcid p-5"><p className="text-xs font-black uppercase tracking-[.22em]">Approved Sales Strategy</p><h2 className="mt-1 text-2xl font-black uppercase">Inventory-first retail expansion</h2><ul className="mt-4 grid gap-2 text-sm font-bold md:grid-cols-2"><li>• Small Bags 为首要库存消化目标</li><li>• 独立自行车店为第一优先渠道</li><li>• 按实际成交单价 50 / 50 分成</li><li>• 3-Month Quality Replacement Guarantee</li></ul><p className="mt-4 text-xs">所有开发邮件继续使用现有人工审批；本页面没有发送或批准能力。</p></section>;
}

function ActivityTable({ data, focus, timezone }: { data: AgentOperations; focus?: AgentId; timezone: string }) {
  const rows = focus ? data.activity.filter(item => item.agent === focus) : data.activity;
  return <section><h2 className="mb-4 text-xl font-black uppercase">Recent Activity</h2><div className="overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["Agent", "时间", "事件类型", "结果", "Customer ID", "Task ID", "数据来源"].map(value => <th key={value} className="p-3 uppercase">{value}</th>)}</tr></thead><tbody>{rows.map(item => <tr key={item.id} className="border-t border-sglInk/15"><td className="p-3 font-black uppercase">{item.agent}</td><td className="p-3">{time(item.occurredAt, timezone)}</td><td className="p-3 font-mono text-xs">{item.eventType}</td><td className="p-3 font-black uppercase">{item.result}</td><td className="p-3 font-mono text-xs">{item.customerId || "N/A"}</td><td className="p-3 font-mono text-xs">{item.taskId || "N/A"}</td><td className="p-3 text-xs">{item.source}</td></tr>)}</tbody></table>{!rows.length && <p className="p-5 text-sm font-bold opacity-60">N/A · 当前来源未连接或没有可安全展示的活动记录。</p>}</div></section>;
}

export default function AgentOperationsDashboard({ data, focus }: { data: AgentOperations; focus?: AgentId }) {
  const agents = focus ? data.agents.filter(agent => agent.id === focus) : data.agents;
  const focused = focus ? agents[0] : null;
  const errors = focus ? data.errors.filter(item => item.agent === focus) : data.errors;
  const approvals = focus ? data.approvals.filter(item => item.agent === focus) : data.approvals;
  return <div className="space-y-8">
    <nav className="flex flex-wrap gap-2" aria-label="Agent Operations"><Link href="/admin/agents" className="border border-sglInk bg-white px-3 py-2 text-xs font-black uppercase">Overview</Link>{data.agents.map(agent => <Link key={agent.id} href={agentLinks[agent.id]} className={`border border-sglInk px-3 py-2 text-xs font-black uppercase ${focus === agent.id ? "bg-sglAcid" : "bg-white"}`}>{agent.id}</Link>)}</nav>
    <div className={`grid gap-5 ${focus ? "grid-cols-1" : "lg:grid-cols-3"}`}>{agents.map(agent => <AgentSummary key={agent.id} agent={agent} timezone={data.timezone} />)}</div>
    {focused && <Metrics agent={focused} timezone={data.timezone} />}
    {focus === "retail" && <RetailPolicy />}
    {focus === "hello" && <section className="border border-sglInk bg-white p-5"><h2 className="text-xl font-black uppercase">Privacy boundary</h2><p className="mt-2 text-sm">仅展示分类、脱敏标识和 Station Customer / Task 关联；完整邮件正文和邮箱凭证不会进入此视图。</p></section>}
    {focus === "fries" && focused?.operationalStatus === "not_deployed" && <section className="border border-slate-700 bg-slate-100 p-5"><h2 className="text-xl font-black uppercase">Not Deployed</h2><p className="mt-2 text-sm">Fries 尚未声明生产部署。测试数据不会被呈现为生产业务指标。</p></section>}
    <section className="grid gap-6 xl:grid-cols-2"><div><h2 className="mb-4 text-xl font-black uppercase">Pending Approvals</h2><div className="border border-sglInk bg-white">{approvals.map(item => <Link key={item.id} href={item.href} className="block border-b border-sglInk/15 p-4 last:border-0 hover:bg-sglAcid"><p className="font-black">{item.label}</p><p className="mt-1 text-xs opacity-60">{item.agent} · {time(item.requestedAt, data.timezone)} · {item.source}</p></Link>)}{!approvals.length && <p className="p-5 text-sm font-bold opacity-60">没有已连接来源报告的待审批项目。</p>}</div></div><div><h2 className="mb-4 text-xl font-black uppercase">Error Monitoring</h2><div className="border border-sglInk bg-white">{errors.map(item => <div key={item.id} className="border-b border-sglInk/15 p-4 last:border-0"><div className="flex items-center justify-between gap-3"><p className="font-mono text-sm font-black">{item.code}</p><StatusBadge status="error" /></div><p className="mt-1 text-xs opacity-60">{item.agent} · {time(item.occurredAt, data.timezone)} · {item.source}</p></div>)}{!errors.length && <p className="p-5 text-sm font-bold opacity-60">未发现已连接来源报告的错误；未连接不代表健康。</p>}</div></div></section>
    <ActivityTable data={data} focus={focus} timezone={data.timezone} />
    <p className="text-[10px] font-bold opacity-55">生成：{time(data.generatedAt, data.timezone)} · 所有外部凭证仅在服务端 BFF 使用。</p>
  </div>;
}

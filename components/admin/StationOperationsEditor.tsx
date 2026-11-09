"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Customer = { id: string; email: string; name: string; source: string; lastContactAt: string; status: string };
type Task = { id: string; customerId: string; source: string; type: string; title: string; summary: string; priority: string; status: string; createdAt: string; dueAt: string | null; completedAt: string | null };
type Command = { id: string; event_type: string; aggregate_id: string; status: string; attempts: number; last_error_code: string | null; created_at: string; delivered_at: string | null; failed_at: string | null };
const adminInput = "mt-1 w-full border border-sglInk bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50";
const adminButton = "border border-sglInk bg-sglAcid px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#172e26] disabled:opacity-50";

async function submit(body: unknown) {
  const response = await fetch("/api/admin/station", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Station 操作提交失败");
  return result;
}

function CustomerRow({ row, writable }: { row: Customer; writable: boolean }) {
  const router = useRouter(); const [name, setName] = useState(row.name); const [status, setStatus] = useState(row.status); const [message, setMessage] = useState("");
  async function save() { setMessage("提交中…"); try { await submit({ type: "station.customer.update", entityId: row.id, idempotencyKey: `customer-${row.id}-${crypto.randomUUID()}`, changes: { name, status } }); setMessage("已进入 Station 待执行队列"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "提交失败"); } }
  return <tr className="border-t border-sglInk/15 align-top"><td className="p-3"><input className={adminInput} value={name} disabled={!writable} onChange={(event) => setName(event.target.value)} /><p className="mt-1 text-xs opacity-55">{row.email}</p></td><td className="p-3 text-xs">{row.source}</td><td className="p-3"><select className={adminInput} value={status} disabled={!writable} onChange={(event) => setStatus(event.target.value)}>{["active", "prospect", "inactive", "archived"].map((value) => <option key={value}>{value}</option>)}</select></td><td className="p-3 text-xs">{new Date(row.lastContactAt).toLocaleString("zh-CN")}</td><td className="p-3">{writable && <button className={adminButton} onClick={save}>保存</button>}<p className="mt-1 max-w-48 text-xs" role="status">{message}</p></td></tr>;
}

function TaskRow({ row, writable }: { row: Task; writable: boolean }) {
  const router = useRouter(); const [status, setStatus] = useState(row.status); const [priority, setPriority] = useState(row.priority); const [dueAt, setDueAt] = useState(row.dueAt ? row.dueAt.slice(0, 16) : ""); const [message, setMessage] = useState("");
  async function save() { setMessage("提交中…"); try { await submit({ type: "station.task.update", entityId: row.id, idempotencyKey: `task-${row.id}-${crypto.randomUUID()}`, changes: { status, priority, dueAt: dueAt ? new Date(dueAt).toISOString() : null } }); setMessage("已进入 Station 待执行队列"); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "提交失败"); } }
  return <tr className="border-t border-sglInk/15 align-top"><td className="p-3"><p className="font-black">{row.title}</p><p className="mt-1 max-w-sm text-xs opacity-65">{row.summary}</p></td><td className="p-3"><select className={adminInput} value={priority} disabled={!writable} onChange={(event) => setPriority(event.target.value)}>{["low", "normal", "high", "urgent"].map((value) => <option key={value}>{value}</option>)}</select></td><td className="p-3"><select className={adminInput} value={status} disabled={!writable} onChange={(event) => setStatus(event.target.value)}>{["open", "in_progress", "completed", "cancelled"].map((value) => <option key={value}>{value}</option>)}</select></td><td className="p-3"><input className={adminInput} type="datetime-local" value={dueAt} disabled={!writable} onChange={(event) => setDueAt(event.target.value)} /></td><td className="p-3">{writable && <button className={adminButton} onClick={save}>保存</button>}<p className="mt-1 max-w-48 text-xs" role="status">{message}</p></td></tr>;
}

export default function StationOperationsEditor({ customers, tasks, commands, writable }: { customers: Customer[]; tasks: Task[]; commands: Command[]; writable: boolean }) {
  return <div className="grid gap-8">
    <section><h2 className="text-2xl font-black uppercase">客户</h2><div className="mt-3 overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["客户", "来源", "状态", "最近联系", "操作"].map((value) => <th key={value} className="p-3 uppercase">{value}</th>)}</tr></thead><tbody>{customers.map((row) => <CustomerRow key={row.id} row={row} writable={writable} />)}</tbody></table>{!customers.length && <p className="p-8 text-center font-bold opacity-55">暂无同步客户。</p>}</div></section>
    <section><h2 className="text-2xl font-black uppercase">人工待办</h2><div className="mt-3 overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["任务", "优先级", "状态", "到期时间", "操作"].map((value) => <th key={value} className="p-3 uppercase">{value}</th>)}</tr></thead><tbody>{tasks.map((row) => <TaskRow key={row.id} row={row} writable={writable} />)}</tbody></table>{!tasks.length && <p className="p-8 text-center font-bold opacity-55">暂无同步任务。</p>}</div></section>
    <section><h2 className="text-2xl font-black uppercase">最近编辑指令</h2><div className="mt-3 overflow-x-auto border border-sglInk bg-white"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-sglInk text-white"><tr>{["类型", "对象", "状态", "尝试", "时间"].map((value) => <th key={value} className="p-3 uppercase">{value}</th>)}</tr></thead><tbody>{commands.map((row) => <tr key={row.id} className="border-t border-sglInk/15"><td className="p-3 font-black">{row.event_type}</td><td className="p-3 font-mono text-xs">{row.aggregate_id}</td><td className="p-3 uppercase">{row.status}{row.last_error_code ? ` · ${row.last_error_code}` : ""}</td><td className="p-3">{row.attempts}</td><td className="p-3 text-xs">{new Date(row.created_at).toLocaleString("zh-CN")}</td></tr>)}</tbody></table>{!commands.length && <p className="p-6 text-center text-sm opacity-55">暂无编辑指令。</p>}</div></section>
  </div>;
}

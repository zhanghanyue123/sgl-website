"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminButton, adminInput } from "./AdminPage";
export default function CategoryForm() {
  const router = useRouter(); const [slug, setSlug] = useState(""); const [name, setName] = useState(""); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); const response = await fetch("/api/admin/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, name, position: 0, active: true }) }); const result = await response.json(); if (!response.ok) return setMessage(result.error || "Unable to create category"); setSlug(""); setName(""); setMessage("Category created."); router.refresh(); }
  return <form onSubmit={submit} className="mt-6 grid gap-3 border border-sglInk bg-white p-5 md:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-bold">Slug<input className={adminInput} value={slug} onChange={(e) => setSlug(e.target.value)} required /></label><label className="text-sm font-bold">Name<input className={adminInput} value={name} onChange={(e) => setName(e.target.value)} required /></label><button className={`${adminButton} self-end`}>Add category</button><p className="text-sm font-bold md:col-span-3" role="status">{message}</p></form>;
}

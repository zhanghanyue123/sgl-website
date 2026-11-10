import Link from "next/link";
const items = [["概览", "/admin/seo"], ["技术问题", "/admin/seo/issues"], ["关键词", "/admin/seo/keywords"], ["优化建议", "/admin/seo/proposals"], ["历史表现", "/admin/seo/performance"]] as const;
export default function SeoNav() { return <nav className="mb-6 flex flex-wrap gap-2">{items.map(([label, href]) => <Link key={href} href={href} className="border border-sglInk bg-white px-3 py-2 text-xs font-black uppercase hover:bg-sglAcid">{label}</Link>)}</nav>; }

"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
export default function ReminderBell() { const [count, setCount] = useState(0); useEffect(() => { void fetch("/api/reminders").then(r => r.ok ? r.json() : null).then(data => { if (data) setCount(data.count ?? 0); }); }, []); return <Link href="/dashboard/reminders" aria-label={`Reminders${count ? `, ${count} due` : ""}`} className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><Bell size={17}/><span className="hidden sm:inline">Reminders</span>{count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{count > 99 ? "99+" : count}</span>}</Link>; }

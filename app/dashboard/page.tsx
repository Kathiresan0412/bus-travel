import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/reports/queries";
import { DashboardCharts } from "@/components/DashboardCharts";
import UpcomingReminders from "@/components/UpcomingReminders";
import { ArrowDownRight, ArrowUpRight, BusFront, CircleDollarSign, Plus } from "lucide-react";

const currency = (minor: number) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 }).format(minor / 100);
function changeText(current: number, previous: number) { if (!previous) return current ? "New this month" : "No records yet"; const ratio = ((current - previous) / Math.abs(previous)) * 100; return `${ratio > 0 ? "+" : ""}${ratio.toFixed(1)}% vs last month`; }

export default async function DashboardPage() {
  const session = await auth(); const canViewReports = Boolean(session?.user.permissions.includes("reports.view"));
  const report = canViewReports ? await getDashboardSummary() : null;
  const todayText = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Colombo" }).format(new Date());
  const cards = report ? [
    { label: "Today's income", value: currency(report.today.incomeMinor), note: "Ticket collection and other income", icon: CircleDollarSign, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Today's expenses", value: currency(report.today.expenseMinor), note: "Bus and allocated shared costs", icon: ArrowDownRight, tone: "text-rose-700 bg-rose-50" },
    { label: "Today's net", value: currency(report.today.profitMinor), note: "Income minus expenses", icon: report.today.profitMinor < 0 ? ArrowDownRight : ArrowUpRight, tone: report.today.profitMinor < 0 ? "text-rose-700 bg-rose-50" : "text-blue-700 bg-blue-50" },
    { label: "Active buses", value: String(report.activeBuses), note: "In your current fleet", icon: BusFront, tone: "text-amber-700 bg-amber-50" }
  ] : [];
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-500">{todayText}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you, {session?.user.name?.split(" ")[0]}</h1><p className="mt-2 text-sm text-slate-500">{canViewReports ? "Here’s the pulse of your bus business." : "Your assigned-bus entries are ready to manage."}</p></div><div className="flex gap-2">{session?.user.permissions.includes("income.create") && <Link href="/dashboard/income" className="flex items-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white"><Plus size={17}/> Add income</Link>}{session?.user.permissions.includes("expense.create") && <Link href="/dashboard/expenses" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><Plus size={17}/> Add expense</Link>}</div></div>
    {report ? <><section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="panel p-5"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={18}/></span></div><p className="mt-5 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></article>)}</section>
      <section className="mt-5 grid gap-4 sm:grid-cols-2"><article className="panel p-5"><p className="text-sm text-slate-500">This month’s profit</p><p className="mt-2 text-2xl font-semibold">{currency(report.currentMonth.profitMinor)}</p><p className="mt-1 text-xs text-slate-400">{changeText(report.currentMonth.profitMinor, report.lastMonth.profitMinor)} · compared with last month</p></article><article className="panel flex items-center justify-between gap-3 p-5"><div><p className="text-sm text-slate-500">Bus performance this month</p><p className="mt-2 text-sm font-medium">Best: {report.bestBus?.bus ?? "No income recorded"}</p><p className="mt-1 text-sm text-slate-500">Needs attention: {report.worstBus?.bus ?? "No income recorded"}</p></div><Link href="/dashboard/reports" className="shrink-0 rounded-lg bg-canvas px-3 py-2 text-sm font-semibold text-forest">View reports</Link></article></section>
      <DashboardCharts trend={report.trend} busProfit={report.busProfit}/>{session?.user.permissions.includes("reminders.view") && <UpcomingReminders/>}</> : <section className="panel mt-8 p-6"><div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-forest"><BusFront/></span><div><h2 className="font-semibold">Assigned-bus workspace</h2><p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Profit reports and business totals are only available to users with report access. You can enter and review today's collections and expenses for your assigned bus.</p></div></div></section>}
  </>;
}

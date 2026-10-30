import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import { BusFront, LayoutDashboard, ShieldCheck, Users } from "lucide-react";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth(); if (!session?.user) redirect("/login");
  const links = [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }, ...(session.user.permissions.includes("users.manage") ? [{ href: "/dashboard/users", label: "Team & access", icon: Users }, { href: "/dashboard/roles", label: "Roles & permissions", icon: ShieldCheck }] : [])];
  return <div className="min-h-screen md:flex"><aside className="flex w-full flex-col border-b border-slate-200 bg-white p-4 md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r md:p-5"><Link href="/dashboard" className="mb-7 flex items-center gap-3 px-2 py-1"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><BusFront size={22}/></span><span><b className="block text-sm">RouteLedger</b><small className="text-slate-400">Bus finance</small></span></Link><nav className="flex gap-2 md:flex-col">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-canvas hover:text-forest"><Icon size={18}/>{label}</Link>)}</nav><div className="mt-auto hidden border-t border-slate-100 pt-4 md:block"><p className="px-3 pb-2 text-sm font-medium">{session.user.name}</p><p className="px-3 pb-3 text-xs capitalize text-slate-400">{session.user.role}</p><SignOutButton/></div></aside><main className="min-h-screen w-full px-4 py-7 md:ml-64 md:px-9 md:py-9"><div className="mx-auto max-w-6xl">{children}</div></main></div>;
}

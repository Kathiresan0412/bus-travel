import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import ReminderBell from "@/components/ReminderBell";
import { BusFront } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth(); if (!session?.user) redirect("/login");

  return <div className="min-h-screen md:flex"><aside className="min-w-0 flex w-full flex-col border-b border-slate-200 bg-white p-4 md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r md:p-5"><Link href="/dashboard" className="mb-4 flex items-center gap-3 px-2 py-1 md:mb-7"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><BusFront size={22}/></span><span><b className="block text-sm">RouteLedger</b><small className="text-slate-400">Bus finance</small></span></Link><DashboardNav permissions={session.user.permissions}/><div className="mt-auto hidden border-t border-slate-100 pt-4 md:block"><p className="px-3 pb-2 text-sm font-medium">{session.user.name}</p><p className="px-3 pb-3 text-xs capitalize text-slate-400">{session.user.role}</p><SignOutButton/></div></aside><main className="min-h-screen w-full min-w-0 px-3 py-5 sm:px-4 sm:py-7 md:ml-64 md:w-[calc(100%_-_16rem)] md:px-9 md:py-9"><div className="mx-auto min-w-0 max-w-6xl"><div className="mb-4 flex justify-end gap-2">{session.user.permissions.includes("reminders.view") && <ReminderBell/>}<span className="md:hidden"><SignOutButton/></span></div>{children}</div></main></div>;
}

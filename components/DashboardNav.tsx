"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BellRing, Bus, CircleDollarSign, ContactRound, FileClock, FileText, History, LayoutDashboard, ReceiptText, Route, ShieldCheck, UserRound, Users, Wallet, Wrench } from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; permission?: string; anyPermissions?: string[] };
const items: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My profile", icon: UserRound },
  { href: "/dashboard/buses", label: "Buses", icon: Bus, permission: "buses.manage" },
  { href: "/dashboard/employees", label: "Employees", icon: ContactRound, permission: "employees.manage" },
  { href: "/dashboard/route-trips", label: "Routes & trips", icon: Route, permission: "settings.manage" },
  { href: "/dashboard/income", label: "Income", icon: Wallet, anyPermissions: ["income.create", "income.view"] },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText, anyPermissions: ["expense.create", "expense.view"] },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "/dashboard/salaries", label: "Salary & advances", icon: Users, permission: "salaries.manage" },
  { href: "/dashboard/loans", label: "Loans", icon: CircleDollarSign, permission: "loans.manage" },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench, permission: "maintenance.manage" },
  { href: "/dashboard/documents", label: "Documents", icon: FileClock, permission: "documents.manage" },
  { href: "/dashboard/reminders", label: "Reminders", icon: BellRing, permission: "reminders.view" },
  { href: "/dashboard/import", label: "Notebook import", icon: FileText, permission: "imports.manage" },
  { href: "/dashboard/audit", label: "Audit history", icon: History, permission: "audit.view" },
  { href: "/dashboard/users", label: "Team & access", icon: Users, permission: "users.manage" },
  { href: "/dashboard/roles", label: "Roles & permissions", icon: ShieldCheck, permission: "users.manage" }
];

export default function DashboardNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const visibleItems = items.filter(item => !item.permission || permissions.includes(item.permission))
    .filter(item => !item.anyPermissions || item.anyPermissions.some(permission => permissions.includes(permission)));

  return <nav aria-label="Main navigation" className="mobile-nav -mx-1 flex min-w-0 flex-nowrap gap-1 overflow-x-auto pb-1 md:mx-0 md:flex-col md:overflow-visible md:pb-0 md:gap-2">
    {visibleItems.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-medium transition-colors sm:gap-3 sm:text-sm md:w-full md:px-3 md:py-2 ${active ? "bg-mint text-forest md:bg-forest md:text-white" : "text-slate-600 hover:bg-canvas hover:text-forest"}`}>
        <Icon size={17}/>{label}
      </Link>;
    })}
  </nav>;
}

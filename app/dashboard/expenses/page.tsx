import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FinanceWorkspace from "@/components/FinanceWorkspace";
export default async function ExpensesPage() { const session = await auth(); if (!session?.user.permissions.some((p: string) => p === "expense.create" || p === "expense.view")) redirect("/dashboard"); return <FinanceWorkspace kind="expense" canManageCategories={session.user.permissions.includes("categories.manage")}/>; }

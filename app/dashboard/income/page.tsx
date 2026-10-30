import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FinanceWorkspace from "@/components/FinanceWorkspace";
export default async function IncomePage() { const session = await auth(); if (!session?.user.permissions.some((p: string) => p === "income.create" || p === "income.view")) redirect("/dashboard"); return <FinanceWorkspace kind="income"/>; }

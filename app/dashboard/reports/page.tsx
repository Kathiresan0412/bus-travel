import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ReportsWorkspace from "@/components/ReportsWorkspace";
export default async function ReportsPage() { const session = await auth(); if (!session?.user.permissions.includes("reports.view")) redirect("/dashboard"); return <ReportsWorkspace/>; }

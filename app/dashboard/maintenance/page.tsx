import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Phase4Workspace from "@/components/Phase4Workspace";
export default async function MaintenancePage() { const session = await auth(); if (!session?.user.permissions.includes("maintenance.manage")) redirect("/dashboard"); return <Phase4Workspace kind="maintenance"/>; }

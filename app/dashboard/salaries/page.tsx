import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Phase4Workspace from "@/components/Phase4Workspace";
export default async function SalariesPage() { const session = await auth(); if (!session?.user.permissions.includes("salaries.manage")) redirect("/dashboard"); return <Phase4Workspace kind="salaries"/>; }

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Phase4Workspace from "@/components/Phase4Workspace";
export default async function DocumentsPage() { const session = await auth(); if (!session?.user.permissions.includes("documents.manage")) redirect("/dashboard"); return <Phase4Workspace kind="documents"/>; }

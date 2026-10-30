import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuditWorkspace from "@/components/AuditWorkspace";
export default async function AuditPage() { const session = await auth(); if (!session?.user.permissions.includes("audit.view")) redirect("/dashboard"); return <AuditWorkspace/>; }

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import RemindersWorkspace from "@/components/RemindersWorkspace";
export default async function RemindersPage() { const session = await auth(); if (!session?.user.permissions.includes("reminders.view")) redirect("/dashboard"); return <RemindersWorkspace/>; }

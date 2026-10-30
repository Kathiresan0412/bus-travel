import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FleetWorkspace from "@/components/FleetWorkspace";
export default async function EmployeesPage() { const session = await auth(); if (!session?.user.permissions.includes("employees.manage")) redirect("/dashboard"); return <FleetWorkspace kind="employees"/>; }

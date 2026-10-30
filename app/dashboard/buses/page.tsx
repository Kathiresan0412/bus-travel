import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import FleetWorkspace from "@/components/FleetWorkspace";
export default async function BusesPage() { const session = await auth(); if (!session?.user.permissions.includes("buses.manage")) redirect("/dashboard"); return <FleetWorkspace kind="buses"/>; }

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import RouteTripsWorkspace from "@/components/RouteTripsWorkspace";
export default async function RouteTripsPage() { const session = await auth(); if (!session?.user.permissions.includes("settings.manage")) redirect("/dashboard"); return <RouteTripsWorkspace/>; }

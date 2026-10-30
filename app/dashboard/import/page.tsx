import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import NotebookImportWorkspace from "@/components/NotebookImportWorkspace";
export default async function ImportPage() { const session = await auth(); if (!session?.user.permissions.includes("imports.manage")) redirect("/dashboard"); return <NotebookImportWorkspace/>; }

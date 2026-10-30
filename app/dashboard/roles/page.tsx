import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Role from "@/models/Role";
import Permission from "@/models/Permission";
import { ShieldCheck } from "lucide-react";
export default async function RolesPage() {
  const session = await auth(); if (!session?.user.permissions.includes("users.manage")) redirect("/dashboard");
  await connectDB(); const [roles, permissions] = await Promise.all([Role.find().sort({ name: 1 }).lean(), Permission.find().sort({ resource: 1, action: 1 }).lean()]);
  const groups = permissions.reduce<Record<string, typeof permissions>>((result, permission) => { (result[permission.resource] ??= []).push(permission); return result; }, {});
  return <><p className="text-sm text-slate-500">Workspace settings</p><h1 className="mt-1 text-3xl font-semibold">Roles & permissions</h1><p className="mt-2 text-sm text-slate-500">Access is enforced on the server for every protected request.</p><div className="mt-7 grid gap-4 xl:grid-cols-2">{roles.map(role => <article key={String(role._id)} className="panel p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><ShieldCheck size={20}/></span><div><h2 className="font-semibold">{role.label}</h2><p className="mt-1 text-xs capitalize text-slate-400">{role.name} · {role.permissions.length} permissions</p></div></div><p className="mt-4 text-sm leading-6 text-slate-500">{role.description}</p><div className="mt-4 space-y-3">{Object.entries(groups).map(([resource, items]) => { const granted = items?.filter(p => role.permissions.includes(p.key)) ?? []; if (!granted.length) return null; return <div key={resource} className="flex flex-wrap gap-1.5"><span className="mr-1 self-center text-xs capitalize text-slate-400">{resource}:</span>{granted.map(p => <span key={p.key} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800">{p.action}</span>)}</div>; })}</div></article>)}</div><p className="mt-4 text-xs text-slate-400">System roles are managed through the seed and deployment configuration.</p></>;
}

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
export type Permission = `${string}.${string}`;
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) return { session: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!session.user.permissions.includes(permission)) return { session, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, response: null };
}
export async function requireOwner() {
  const result = await requirePermission("users.manage");
  return result;
}
export async function requireAnyPermission(permissions: Permission[]) {
  const session = await auth();
  if (!session?.user) return { session: null, response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  if (!permissions.some(permission => session.user.permissions.includes(permission))) return { session, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, response: null };
}

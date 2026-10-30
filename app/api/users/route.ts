import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import { passwordSchema } from "@/validations/auth";
import User from "@/models/User";
import Role from "@/models/Role";
import AuditLog from "@/models/AuditLog";

const createUserSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), password: passwordSchema, role: z.string().regex(/^[a-f\d]{24}$/i), assignedBus: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional() });
export async function GET() {
  const gate = await requireOwner(); if (gate.response) return gate.response;
  await connectDB();
  const users = await User.find({ deletedAt: null }).select("name email role assignedBus isActive createdAt").populate("role", "name label").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ users });
}
export async function POST(request: NextRequest) {
  const gate = await requireOwner(); if (gate.response) return gate.response;
  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid user details", details: parsed.error.flatten() }, { status: 400 });
  await connectDB();
  if (!(await Role.exists({ _id: parsed.data.role }))) return NextResponse.json({ error: "Role not found" }, { status: 400 });
  const duplicate = await User.exists({ email: parsed.data.email });
  if (duplicate) return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
  const user = await User.create({ name: parsed.data.name, email: parsed.data.email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: parsed.data.role, assignedBus: parsed.data.assignedBus ?? null, createdBy: gate.session!.user.id, updatedBy: gate.session!.user.id });
  await AuditLog.create({ actor: gate.session!.user.id, action: "create", resource: "user", resourceId: user.id, newValue: { name: user.name, email: user.email, role: user.role.toString() } });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}

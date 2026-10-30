import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import AuditLog from "@/models/AuditLog";
import EntryChoice from "@/models/EntryChoice";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("settings.manage"); if (gate.response) return gate.response;
  const { id } = await params; const body = await request.json().catch(() => null);
  const value = typeof body?.value === "string" ? body.value.trim() : "";
  if (!/^[a-f\d]{24}$/i.test(id) || !value || value.length > 160) return NextResponse.json({ error: "Enter a valid value" }, { status: 400 });
  await connectDB(); const userId = gate.session!.user.id;
  const choice = await EntryChoice.findOneAndUpdate({ _id: id, deletedAt: null }, { value, updatedBy: userId }, { new: true, runValidators: true });
  if (!choice) return NextResponse.json({ error: "Choice not found" }, { status: 404 });
  await AuditLog.create({ actor: userId, action: "update", resource: "entryChoice", resourceId: id, newValue: choice.toObject() });
  return NextResponse.json({ choice });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("settings.manage"); if (gate.response) return gate.response;
  const { id } = await params; if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid route / trip" }, { status: 400 });
  await connectDB(); const userId = gate.session!.user.id;
  const choice = await EntryChoice.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date(), updatedBy: userId }, { new: true });
  if (!choice) return NextResponse.json({ error: "Choice not found" }, { status: 404 });
  await AuditLog.create({ actor: userId, action: "delete", resource: "entryChoice", resourceId: id, newValue: choice.toObject() });
  return NextResponse.json({ ok: true });
}

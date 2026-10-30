import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { busInput } from "@/validations/operations";
import Bus from "@/models/Bus";
import AuditLog from "@/models/AuditLog";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("buses.manage"); if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid bus" }, { status: 400 });
  const parsed = busInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid bus details", details: parsed.error.flatten() }, { status: 400 });
  await connectDB();
  const registrationNumber = parsed.data.registrationNumber.toUpperCase();
  if (await Bus.exists({ _id: { $ne: id }, registrationNumber })) return NextResponse.json({ error: "That registration number is already in use" }, { status: 409 });
  const userId = gate.session!.user.id;
  const bus = await Bus.findOneAndUpdate({ _id: id, deletedAt: null }, { ...parsed.data, registrationNumber, purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null, updatedBy: userId }, { new: true, runValidators: true });
  if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 404 });
  await AuditLog.create({ actor: userId, action: "update", resource: "bus", resourceId: id, newValue: bus.toObject() });
  return NextResponse.json({ bus });
}

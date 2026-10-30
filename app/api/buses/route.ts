import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAnyPermission, requirePermission } from "@/lib/permissions";
import { busInput } from "@/validations/operations";
import Bus from "@/models/Bus";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  const gate = await requireAnyPermission(["buses.manage", "income.create", "income.view", "expense.create", "expense.view"]); if (gate.response) return gate.response;
  await connectDB();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (gate.session!.user.role === "driver") {
    const user = (await User.findById(gate.session!.user.id).select("assignedBus").lean()) as unknown as { assignedBus?: unknown } | null;
    filter._id = user?.assignedBus ?? null;
  }
  const buses = await Bus.find(filter).sort({ name: 1 }).lean();
  return NextResponse.json({ buses });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("buses.manage"); if (gate.response) return gate.response;
  const parsed = busInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid bus details", details: parsed.error.flatten() }, { status: 400 });
  await connectDB();
  const userId = gate.session!.user.id;
  const bus = await Bus.create({ ...parsed.data, registrationNumber: parsed.data.registrationNumber.toUpperCase(), purchaseDate: parsed.data.purchaseDate ? new Date(parsed.data.purchaseDate) : null, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "bus", resourceId: bus.id, newValue: bus.toObject() });
  return NextResponse.json({ bus }, { status: 201 });
}

import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { maintenanceInput, toMinorUnits } from "@/validations/operations";
import MaintenanceRecord from "@/models/MaintenanceRecord";
import ExpenseCategory from "@/models/ExpenseCategory";
import Expense from "@/models/Expense";
import Bus from "@/models/Bus";
import AuditLog from "@/models/AuditLog";
function validDate(value?: string | null) { if (!value) return null; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : undefined; }
export async function GET() {
  const gate = await requirePermission("maintenance.manage"); if (gate.response) return gate.response;
  await connectDB(); const records = await MaintenanceRecord.find({ deletedAt: null }).populate("bus", "name registrationNumber currentOdometerKm").sort({ date: -1 }).limit(250).lean();
  return NextResponse.json({ records });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("maintenance.manage"); if (gate.response) return gate.response;
  const parsed = maintenanceInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid maintenance record", details: parsed.error.flatten() }, { status: 400 });
  const date = validDate(parsed.data.date); const nextServiceDate = validDate(parsed.data.nextServiceDate);
  if (!date || nextServiceDate === undefined) return NextResponse.json({ error: "Enter valid service dates" }, { status: 400 });
  await connectDB(); const bus = await Bus.findOne({ _id: parsed.data.bus, deletedAt: null }); if (!bus) return NextResponse.json({ error: "Bus not found" }, { status: 400 });
  const costMinor = toMinorUnits(parsed.data.cost); const userId = gate.session!.user.id; const session = await mongoose.startSession(); let record: InstanceType<typeof MaintenanceRecord> | null = null;
  try {
    await session.withTransaction(async () => {
      [record] = await MaintenanceRecord.create([{ ...parsed.data, date, nextServiceDate: nextServiceDate ?? null, costMinor, createdBy: userId, updatedBy: userId }], { session });
      if (costMinor > 0) {
        const category = await ExpenseCategory.findOne({ slug: "maintenance-and-repair", isActive: true, deletedAt: null }).session(session);
        if (!category) throw new Error("The Maintenance and Repair expense category is missing. Run npm run seed.");
        await Expense.create([{ date, bus: bus._id, isShared: false, allocations: [{ bus: bus._id, ratioBps: 10000, amountMinor: costMinor }], category: category._id, amountMinor: costMinor, currency: "LKR", paymentMethod: "cash", notes: `Maintenance: ${parsed.data.description}`, createdBy: userId, updatedBy: userId }], { session });
      }
    });
  } finally { await session.endSession(); }
  if (!record) return NextResponse.json({ error: "Could not save maintenance record" }, { status: 500 });
  await AuditLog.create({ actor: userId, action: "create", resource: "maintenanceRecord", resourceId: record.id, newValue: record.toObject() });
  return NextResponse.json({ record }, { status: 201 });
}

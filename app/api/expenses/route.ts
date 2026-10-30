import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { businessDateString, dateOnly } from "@/lib/business-date";
import { requireAnyPermission, requirePermission } from "@/lib/permissions";
import { expenseInput, toMinorUnits } from "@/validations/operations";
import Expense from "@/models/Expense";
import ExpenseCategory from "@/models/ExpenseCategory";
import Bus from "@/models/Bus";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
export async function GET(request: NextRequest) {
  const gate = await requireAnyPermission(["expense.view", "expense.create"]); if (gate.response) return gate.response;
  await connectDB(); const filter: Record<string, unknown> = { deletedAt: null };
  if (gate.session!.user.role === "driver") {
    const user = (await User.findById(gate.session!.user.id).select("assignedBus").lean()) as unknown as { assignedBus?: unknown } | null; const bus = user?.assignedBus ?? null;
    filter.$or = [{ bus }, { allocations: { $elemMatch: { bus } } }]; filter.date = dateOnly(businessDateString())!;
  } else {
    const date = request.nextUrl.searchParams.get("date"); if (date) { const parsed = dateOnly(date); if (!parsed) return NextResponse.json({ error: "Invalid date" }, { status: 400 }); filter.date = parsed; }
  }
  const expenses = await Expense.find(filter).populate("bus", "name registrationNumber").populate("category", "name").sort({ date: -1, createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ expenses });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("expense.create"); if (gate.response) return gate.response;
  const parsed = expenseInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid expense details", details: parsed.error.flatten() }, { status: 400 });
  const date = dateOnly(parsed.data.date); if (!date) return NextResponse.json({ error: "Enter a valid date" }, { status: 400 });
  const userId = gate.session!.user.id; const isDriver = gate.session!.user.role === "driver";
  await connectDB();
  if (!(await ExpenseCategory.exists({ _id: parsed.data.category, isActive: true, deletedAt: null }))) return NextResponse.json({ error: "Choose an active expense category" }, { status: 400 });
  if (isDriver && (parsed.data.date !== businessDateString() || parsed.data.isShared)) return NextResponse.json({ error: "Drivers can only enter today's expense for their assigned bus" }, { status: 403 });
  let busId = parsed.data.bus ?? null; let allocations: { bus: string; ratioBps: number; amountMinor: number }[] = [];
  const amountMinor = toMinorUnits(parsed.data.amount);
  if (parsed.data.isShared) {
    if (isDriver || !parsed.data.sharedBusIds?.length) return NextResponse.json({ error: "Choose buses to split this shared expense across" }, { status: 400 });
    const uniqueIds = [...new Set(parsed.data.sharedBusIds)];
    const activeCount = await Bus.countDocuments({ _id: { $in: uniqueIds }, deletedAt: null, status: { $ne: "sold" } });
    if (activeCount !== uniqueIds.length) return NextResponse.json({ error: "One or more selected buses are unavailable" }, { status: 400 });
    const ratio = Math.floor(10000 / uniqueIds.length); let remaining = amountMinor;
    allocations = uniqueIds.map((id, i) => { const share = i === uniqueIds.length - 1 ? remaining : Math.floor(amountMinor / uniqueIds.length); remaining -= share; return { bus: id, ratioBps: i === uniqueIds.length - 1 ? 10000 - ratio * (uniqueIds.length - 1) : ratio, amountMinor: share }; });
    busId = null;
  } else {
    if (!busId || !(await Bus.exists({ _id: busId, deletedAt: null, status: { $ne: "sold" } }))) return NextResponse.json({ error: "Choose an available bus" }, { status: 400 });
    if (isDriver) { const user = (await User.findById(userId).select("assignedBus").lean()) as unknown as { assignedBus?: unknown } | null; if (!user?.assignedBus || String(user.assignedBus) !== busId) return NextResponse.json({ error: "You can only enter expenses for your assigned bus" }, { status: 403 }); }
    allocations = [{ bus: busId, ratioBps: 10000, amountMinor }];
  }
  const record = await Expense.create({ ...parsed.data, date, bus: busId, amountMinor, allocations, fuelLitres: parsed.data.fuelLitres ?? null, pricePerLitreMinor: parsed.data.pricePerLitre ? toMinorUnits(parsed.data.pricePerLitre) : null, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "expense", resourceId: record.id, newValue: record.toObject() });
  return NextResponse.json({ expense: record }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { businessDateString, dateOnly } from "@/lib/business-date";
import { requireAnyPermission, requirePermission } from "@/lib/permissions";
import { incomeInput, toMinorUnits } from "@/validations/operations";
import Income from "@/models/Income";
import Bus from "@/models/Bus";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import Employee from "@/models/Employee";
export async function GET(request: NextRequest) {
  const gate = await requireAnyPermission(["income.view", "income.create"]); if (gate.response) return gate.response;
  await connectDB(); const filter: Record<string, unknown> = { deletedAt: null };
  if (gate.session!.user.role === "driver") {
    const user = (await User.findById(gate.session!.user.id).select("assignedBus").lean()) as unknown as { assignedBus?: unknown } | null;
    filter.bus = user?.assignedBus ?? null;
    const date = dateOnly(businessDateString())!; filter.date = date;
  } else {
    const date = request.nextUrl.searchParams.get("date");
    if (date) { const parsed = dateOnly(date); if (!parsed) return NextResponse.json({ error: "Invalid date" }, { status: 400 }); filter.date = parsed; }
  }
  const incomes = await Income.find(filter).populate("bus", "name registrationNumber").populate("driver", "name").populate("conductor", "name").sort({ date: -1, createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ incomes });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("income.create"); if (gate.response) return gate.response;
  const parsed = incomeInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid income details", details: parsed.error.flatten() }, { status: 400 });
  const date = dateOnly(parsed.data.date); if (!date) return NextResponse.json({ error: "Enter a valid date" }, { status: 400 });
  await connectDB(); const userId = gate.session!.user.id;
  if (!(await Bus.exists({ _id: parsed.data.bus, deletedAt: null, status: { $ne: "sold" } }))) return NextResponse.json({ error: "Choose an available bus" }, { status: 400 });
  for (const [employeeId, role] of [[parsed.data.driver, "driver"], [parsed.data.conductor, "conductor"]] as const) {
    if (employeeId && !(await Employee.exists({ _id: employeeId, role, assignedBus: parsed.data.bus, isActive: true, deletedAt: null }))) return NextResponse.json({ error: `Selected ${role} is not active or assigned to this bus` }, { status: 400 });
  }
  if (gate.session!.user.role === "driver") {
    const user = (await User.findById(userId).select("assignedBus").lean()) as unknown as { assignedBus?: unknown } | null;
    if (!user?.assignedBus || String(user.assignedBus) !== parsed.data.bus || parsed.data.date !== businessDateString()) return NextResponse.json({ error: "Drivers can only enter today's collection for their assigned bus" }, { status: 403 });
  }
  const record = await Income.create({ ...parsed.data, date, ticketCollectionMinor: toMinorUnits(parsed.data.ticketCollection), otherIncomeMinor: toMinorUnits(parsed.data.otherIncome), createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "income", resourceId: record.id, newValue: record.toObject() });
  return NextResponse.json({ income: record }, { status: 201 });
}

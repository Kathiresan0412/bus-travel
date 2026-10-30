import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { advanceInput, toMinorUnits } from "@/validations/operations";
import Advance from "@/models/Advance";
import Employee from "@/models/Employee";
import AuditLog from "@/models/AuditLog";
export async function GET(request: NextRequest) {
  const gate = await requirePermission("salaries.manage"); if (gate.response) return gate.response;
  await connectDB(); const employee = request.nextUrl.searchParams.get("employee");
  const filter: Record<string, unknown> = { deletedAt: null }; if (employee) filter.employee = employee;
  const records = await Advance.find(filter).populate("employee", "name role").sort({ date: -1 }).limit(250).lean();
  return NextResponse.json({ records });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("salaries.manage"); if (gate.response) return gate.response;
  const parsed = advanceInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid advance or deduction", details: parsed.error.flatten() }, { status: 400 });
  const date = new Date(`${parsed.data.date}T00:00:00.000Z`); if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== parsed.data.date) return NextResponse.json({ error: "Enter a valid date" }, { status: 400 });
  await connectDB(); if (!(await Employee.exists({ _id: parsed.data.employee, deletedAt: null }))) return NextResponse.json({ error: "Employee not found" }, { status: 400 });
  const userId = gate.session!.user.id; const record = await Advance.create({ ...parsed.data, date, amountMinor: toMinorUnits(parsed.data.amount), createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "advance", resourceId: record.id, newValue: record.toObject() });
  return NextResponse.json({ record }, { status: 201 });
}

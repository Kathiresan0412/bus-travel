import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { salaryInput, toMinorUnits } from "@/validations/operations";
import Employee from "@/models/Employee";
import SalaryRecord from "@/models/SalaryRecord";
import AuditLog from "@/models/AuditLog";
import { businessDateString } from "@/lib/business-date";
export async function GET(request: NextRequest) {
  const gate = await requirePermission("salaries.manage"); if (gate.response) return gate.response;
  const period = request.nextUrl.searchParams.get("period") ?? businessDateString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return NextResponse.json({ error: "Choose a valid salary month" }, { status: 400 });
  await connectDB(); const [records, employees] = await Promise.all([SalaryRecord.find({ period, deletedAt: null }).populate("employee", "name role salaryType").sort({ createdAt: -1 }).lean(), Employee.find({ deletedAt: null, isActive: true }).select("name role salaryType salaryAmountMinor").sort({ name: 1 }).lean()]);
  const totals = records.reduce((sum, row) => ({ grossMinor: sum.grossMinor + row.grossMinor, deductionsMinor: sum.deductionsMinor + row.advanceDeductionMinor + row.otherDeductionMinor, netMinor: sum.netMinor + row.netMinor }), { grossMinor: 0, deductionsMinor: 0, netMinor: 0 });
  return NextResponse.json({ period, records, employees, totals });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("salaries.manage"); if (gate.response) return gate.response;
  const parsed = salaryInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid salary details", details: parsed.error.flatten() }, { status: 400 });
  const grossMinor = toMinorUnits(parsed.data.gross); const advanceDeductionMinor = toMinorUnits(parsed.data.advanceDeduction); const otherDeductionMinor = toMinorUnits(parsed.data.otherDeduction); const netMinor = grossMinor - advanceDeductionMinor - otherDeductionMinor;
  if (netMinor < 0) return NextResponse.json({ error: "Deductions cannot be more than gross salary" }, { status: 400 });
  await connectDB(); if (!(await Employee.exists({ _id: parsed.data.employee, deletedAt: null }))) return NextResponse.json({ error: "Employee not found" }, { status: 400 });
  const userId = gate.session!.user.id;
  const record = await SalaryRecord.findOneAndUpdate({ employee: parsed.data.employee, period: parsed.data.period }, { $set: { grossMinor, advanceDeductionMinor, otherDeductionMinor, netMinor, status: parsed.data.status, paidAt: parsed.data.status === "paid" ? new Date() : null, note: parsed.data.note, updatedBy: userId }, $setOnInsert: { employee: parsed.data.employee, period: parsed.data.period, createdBy: userId, deletedAt: null } }, { upsert: true, new: true, runValidators: true });
  await AuditLog.create({ actor: userId, action: "upsert", resource: "salaryRecord", resourceId: record.id, newValue: record.toObject() });
  return NextResponse.json({ record }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { loanInput, toMinorUnits } from "@/validations/operations";
import Loan from "@/models/Loan";
import Bus from "@/models/Bus";
import LoanPayment from "@/models/LoanPayment";
import AuditLog from "@/models/AuditLog";
export async function GET() {
  const gate = await requirePermission("loans.manage"); if (gate.response) return gate.response;
  await connectDB(); const loans = await Loan.find({ deletedAt: null }).populate("bus", "name registrationNumber").sort({ status: 1, createdAt: -1 }).lean();
  const payments = await LoanPayment.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: "$loan", paidMinor: { $sum: "$amountMinor" } } }]);
  const paidMap = new Map(payments.map(row => [String(row._id), row.paidMinor]));
  return NextResponse.json({ loans: loans.map(loan => ({ ...loan, paidMinor: paidMap.get(String(loan._id)) ?? 0 })) });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("loans.manage"); if (gate.response) return gate.response;
  const parsed = loanInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid loan details", details: parsed.error.flatten() }, { status: 400 });
  const startDate = new Date(`${parsed.data.startDate}T00:00:00.000Z`); if (!Number.isFinite(startDate.getTime()) || startDate.toISOString().slice(0, 10) !== parsed.data.startDate) return NextResponse.json({ error: "Enter a valid loan start date" }, { status: 400 });
  await connectDB(); if (!(await Bus.exists({ _id: parsed.data.bus, deletedAt: null }))) return NextResponse.json({ error: "Bus not found" }, { status: 400 });
  const userId = gate.session!.user.id; const principalMinor = toMinorUnits(parsed.data.principal);
  const loan = await Loan.create({ bus: parsed.data.bus, lender: parsed.data.lender, principalMinor, balanceMinor: principalMinor, installmentMinor: toMinorUnits(parsed.data.installment), startDate, note: parsed.data.note, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "loan", resourceId: loan.id, newValue: loan.toObject() });
  return NextResponse.json({ loan }, { status: 201 });
}

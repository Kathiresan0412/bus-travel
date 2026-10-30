import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { loanPaymentInput, toMinorUnits } from "@/validations/operations";
import Loan from "@/models/Loan";
import LoanPayment from "@/models/LoanPayment";
import AuditLog from "@/models/AuditLog";
export async function POST(request: NextRequest) {
  const gate = await requirePermission("loans.manage"); if (gate.response) return gate.response;
  const parsed = loanPaymentInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid installment payment", details: parsed.error.flatten() }, { status: 400 });
  const date = new Date(`${parsed.data.date}T00:00:00.000Z`); if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== parsed.data.date) return NextResponse.json({ error: "Enter a valid payment date" }, { status: 400 });
  await connectDB(); const amountMinor = toMinorUnits(parsed.data.amount); const userId = gate.session!.user.id;
  const loan = await Loan.findOneAndUpdate({ _id: parsed.data.loan, status: "active", deletedAt: null, balanceMinor: { $gte: amountMinor } }, { $inc: { balanceMinor: -amountMinor }, $set: { updatedBy: userId } }, { new: true });
  if (!loan) return NextResponse.json({ error: "Loan not found, already paid, or payment exceeds remaining balance" }, { status: 409 });
  let payment: InstanceType<typeof LoanPayment> | null = null;
  try { [payment] = await LoanPayment.create([{ loan: loan._id, bus: loan.bus, date, amountMinor, method: parsed.data.method, note: parsed.data.note, createdBy: userId, updatedBy: userId }]); }
  catch (error) {
    await Loan.updateOne({ _id: loan._id }, { $inc: { balanceMinor: amountMinor }, $set: { status: "active" } });
    throw error;
  }
  if (!payment) return NextResponse.json({ error: "Could not save loan payment" }, { status: 500 });
  if (loan.balanceMinor === 0) await Loan.updateOne({ _id: loan._id, balanceMinor: 0 }, { $set: { status: "paid_off" } });
  await AuditLog.create({ actor: userId, action: "create", resource: "loanPayment", resourceId: payment.id, newValue: payment.toObject() });
  return NextResponse.json({ payment, remainingMinor: loan.balanceMinor }, { status: 201 });
}

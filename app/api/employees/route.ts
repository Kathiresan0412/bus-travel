import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { employeeInput } from "@/validations/operations";
import Employee from "@/models/Employee";
import Bus from "@/models/Bus";
import AuditLog from "@/models/AuditLog";
export async function GET() {
  const gate = await requirePermission("employees.manage"); if (gate.response) return gate.response;
  await connectDB(); const employees = await Employee.find({ deletedAt: null }).populate("assignedBus", "name registrationNumber").sort({ name: 1 }).lean();
  return NextResponse.json({ employees });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("employees.manage"); if (gate.response) return gate.response;
  const parsed = employeeInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid employee details", details: parsed.error.flatten() }, { status: 400 });
  await connectDB();
  if (parsed.data.assignedBus && !(await Bus.exists({ _id: parsed.data.assignedBus, deletedAt: null }))) return NextResponse.json({ error: "Bus not found" }, { status: 400 });
  const userId = gate.session!.user.id;
  const employee = await Employee.create({ ...parsed.data, licenseExpiry: parsed.data.licenseExpiry ? new Date(parsed.data.licenseExpiry) : null, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "employee", resourceId: employee.id, newValue: employee.toObject() });
  return NextResponse.json({ employee }, { status: 201 });
}

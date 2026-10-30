import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { employeeInput } from "@/validations/operations";
import Employee from "@/models/Employee";
import Bus from "@/models/Bus";
import AuditLog from "@/models/AuditLog";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("employees.manage"); if (gate.response) return gate.response;
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
  const parsed = employeeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid employee details", details: parsed.error.flatten() }, { status: 400 });
  await connectDB();
  if (parsed.data.assignedBus && !(await Bus.exists({ _id: parsed.data.assignedBus, deletedAt: null }))) return NextResponse.json({ error: "Bus not found" }, { status: 400 });
  const userId = gate.session!.user.id;
  const employee = await Employee.findOneAndUpdate({ _id: id, deletedAt: null }, { ...parsed.data, licenseExpiry: parsed.data.licenseExpiry ? new Date(parsed.data.licenseExpiry) : null, updatedBy: userId }, { new: true, runValidators: true });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  await AuditLog.create({ actor: userId, action: "update", resource: "employee", resourceId: id, newValue: employee.toObject() });
  return NextResponse.json({ employee });
}

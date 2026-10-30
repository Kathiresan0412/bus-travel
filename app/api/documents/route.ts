import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { documentInput } from "@/validations/operations";
import Document from "@/models/Document";
import Bus from "@/models/Bus";
import Employee from "@/models/Employee";
import AuditLog from "@/models/AuditLog";
function parseDate(value?: string | null) { if (!value) return null; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : undefined; }
export async function GET() {
  const gate = await requirePermission("documents.manage"); if (gate.response) return gate.response;
  await connectDB(); const records = await Document.find({ deletedAt: null }).populate("bus", "name registrationNumber").populate("employee", "name role").sort({ expiryDate: 1 }).lean();
  return NextResponse.json({ records });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("documents.manage"); if (gate.response) return gate.response;
  const parsed = documentInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid document details", details: parsed.error.flatten() }, { status: 400 });
  const expiryDate = parseDate(parsed.data.expiryDate); const issuedAt = parseDate(parsed.data.issuedAt);
  if (!expiryDate || issuedAt === undefined) return NextResponse.json({ error: "Enter valid document dates" }, { status: 400 });
  if (!parsed.data.bus && !parsed.data.employee) return NextResponse.json({ error: "Link the document to a bus or employee" }, { status: 400 });
  await connectDB();
  if (parsed.data.bus && !(await Bus.exists({ _id: parsed.data.bus, deletedAt: null }))) return NextResponse.json({ error: "Bus not found" }, { status: 400 });
  if (parsed.data.employee && !(await Employee.exists({ _id: parsed.data.employee, deletedAt: null }))) return NextResponse.json({ error: "Employee not found" }, { status: 400 });
  if (parsed.data.kind === "driver_license" && !parsed.data.employee) return NextResponse.json({ error: "Driver licenses must be linked to an employee" }, { status: 400 });
  const userId = gate.session!.user.id; const record = await Document.create({ ...parsed.data, expiryDate, issuedAt: issuedAt ?? null, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "document", resourceId: record.id, newValue: record.toObject() });
  return NextResponse.json({ record }, { status: 201 });
}

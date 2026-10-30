import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAnyPermission } from "@/lib/permissions";
import Bus from "@/models/Bus";
import Employee from "@/models/Employee";
export async function GET() {
  const gate = await requireAnyPermission(["salaries.manage", "loans.manage", "maintenance.manage", "documents.manage"]); if (gate.response) return gate.response;
  await connectDB(); const [buses, employees] = await Promise.all([Bus.find({ deletedAt: null, status: { $ne: "sold" } }).select("name registrationNumber currentOdometerKm").sort({ name: 1 }).lean(), Employee.find({ deletedAt: null, isActive: true }).select("name role salaryType salaryAmountMinor").sort({ name: 1 }).lean()]);
  return NextResponse.json({ buses, employees });
}

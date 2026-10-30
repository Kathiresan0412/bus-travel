import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import Bus from "@/models/Bus";
import Employee from "@/models/Employee";
import ExpenseCategory from "@/models/ExpenseCategory";
export async function GET() {
  const gate = await requirePermission("reports.view"); if (gate.response) return gate.response;
  await connectDB();
  const [buses, employees, categories] = await Promise.all([
    Bus.find({ deletedAt: null }).select("name registrationNumber").sort({ name: 1 }).lean(),
    Employee.find({ deletedAt: null, isActive: true }).select("name role").sort({ name: 1 }).lean(),
    ExpenseCategory.find({ deletedAt: null, isActive: true }).select("name").sort({ name: 1 }).lean()
  ]);
  return NextResponse.json({ buses, employees, categories });
}

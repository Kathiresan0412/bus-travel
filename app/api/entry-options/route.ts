import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAnyPermission } from "@/lib/permissions";
import Employee from "@/models/Employee";
import User from "@/models/User";
export async function GET() {
  const gate = await requireAnyPermission(["income.create", "expense.create"]); if (gate.response) return gate.response;
  await connectDB(); const filter: Record<string, unknown> = { isActive: true, deletedAt: null };
  if (gate.session!.user.role === "driver") {
    const user = (await User.findById(gate.session!.user.id).select("assignedBus").lean()) as unknown as { assignedBus?: unknown } | null;
    filter.assignedBus = user?.assignedBus ?? null;
  }
  const employees = await Employee.find(filter).select("name role assignedBus").sort({ name: 1 }).lean();
  return NextResponse.json({ employees });
}

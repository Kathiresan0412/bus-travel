import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAnyPermission, requirePermission } from "@/lib/permissions";
import { categoryInput } from "@/validations/operations";
import ExpenseCategory from "@/models/ExpenseCategory";
import AuditLog from "@/models/AuditLog";
export async function GET() {
  const gate = await requireAnyPermission(["expense.create", "expense.view", "categories.manage"]); if (gate.response) return gate.response;
  await connectDB(); const categories = await ExpenseCategory.find({ isActive: true, deletedAt: null }).sort({ name: 1 }).lean();
  return NextResponse.json({ categories });
}
export async function POST(request: NextRequest) {
  const gate = await requirePermission("categories.manage"); if (gate.response) return gate.response;
  const parsed = categoryInput.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter a valid category name", details: parsed.error.flatten() }, { status: 400 });
  await connectDB(); const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (await ExpenseCategory.exists({ slug })) return NextResponse.json({ error: "That category already exists" }, { status: 409 });
  const userId = gate.session!.user.id; const category = await ExpenseCategory.create({ ...parsed.data, slug, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "expenseCategory", resourceId: category.id, newValue: category.toObject() });
  return NextResponse.json({ category }, { status: 201 });
}

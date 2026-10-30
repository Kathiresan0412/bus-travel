import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAnyPermission, requirePermission } from "@/lib/permissions";
import RouteTripOption from "@/models/RouteTripOption";
import AuditLog from "@/models/AuditLog";
import EntryChoice from "@/models/EntryChoice";

export async function GET() {
  const gate = await requireAnyPermission(["income.create", "income.view", "expense.create", "expense.view", "settings.manage"]);
  if (gate.response) return gate.response;
  await connectDB();
  const [legacy, choices] = await Promise.all([
    RouteTripOption.find({ isActive: true, deletedAt: null }).sort({ route: 1, tripLabel: 1 }).lean(),
    EntryChoice.find({ deletedAt: null }).sort({ value: 1 }).lean(),
  ]);
  const values = (kind: "route" | "tripLabel", field: "route" | "tripLabel") => {
    const sourceValues = [
      ...legacy.map(option => option[field]).filter(Boolean),
      ...choices.filter(choice => choice.kind === kind).map(choice => choice.value),
    ];
    const unique = new Map<string, string>();
    for (const value of sourceValues) {
      if (typeof value !== "string") continue;
      const cleaned = value.trim().replace(/\s+/g, " ");
      const key = cleaned.toLocaleLowerCase();
      if (key && !unique.has(key)) unique.set(key, cleaned);
    }
    return [...unique.values()].sort((a, b) => a.localeCompare(b));
  };
  return NextResponse.json({ routes: values("route", "route"), tripLabels: values("tripLabel", "tripLabel"), choices: choices.filter(choice => choice.kind !== "trip") });
}

export async function POST(request: NextRequest) {
  const gate = await requirePermission("settings.manage"); if (gate.response) return gate.response;
  const body = await request.json().catch(() => null);
  const kind = body?.kind; const value = typeof body?.value === "string" ? body.value.trim() : "";
  if (!(kind === "route" || kind === "tripLabel") || !value || value.length > 160) return NextResponse.json({ error: "Enter a valid choice and value" }, { status: 400 });
  await connectDB();
  const existing = await EntryChoice.find({ kind, deletedAt: null }).select("value").lean();
  const duplicate = existing.some(choice => choice.value.trim().replace(/\s+/g, " ").toLocaleLowerCase() === value.replace(/\s+/g, " ").toLocaleLowerCase());
  if (duplicate) return NextResponse.json({ error: "That choice already exists" }, { status: 409 });
  const userId = gate.session!.user.id;
  const choice = await EntryChoice.create({ kind, value, createdBy: userId, updatedBy: userId });
  await AuditLog.create({ actor: userId, action: "create", resource: "entryChoice", resourceId: choice.id, newValue: choice.toObject() });
  return NextResponse.json({ choice }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getReport, ReportType } from "@/reports/queries";
const allowed = new Set<ReportType>(["daily", "monthly", "yearly", "buswise", "compare", "categories", "fuel"]);
export async function GET(request: NextRequest) {
  const gate = await requirePermission("reports.view"); if (gate.response) return gate.response;
  const query = request.nextUrl.searchParams; const type = query.get("type") as ReportType | null;
  if (!type || !allowed.has(type)) return NextResponse.json({ error: "Choose a supported report" }, { status: 400 });
  const from = query.get("from"); const to = query.get("to");
  if (!from || !to) return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  try {
    const filters = { from, to, bus: query.get("bus") || undefined, category: query.get("category") || undefined, employee: query.get("employee") || undefined };
    const data = await getReport(type, filters);
    return NextResponse.json({ type, filters, data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load report" }, { status: 400 });
  }
}

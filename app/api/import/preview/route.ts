import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { readNotebook } from "@/lib/notebook-file";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const gate = await requirePermission("imports.manage"); if (gate.response) return gate.response;
  try {
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Select a CSV or XLSX file" }, { status: 400 });
    const data = await readNotebook(file);
    return NextResponse.json({ columns: data.columns, sampleRows: data.rows.slice(0, 12), totalRows: data.totalRows });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read the notebook file" }, { status: 400 }); }
}

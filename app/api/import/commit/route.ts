import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { parseNotebookDate, parseNotebookMoney, readNotebook } from "@/lib/notebook-file";
import Income from "@/models/Income";
import Expense from "@/models/Expense";
import Bus from "@/models/Bus";
import ExpenseCategory from "@/models/ExpenseCategory";
import AuditLog from "@/models/AuditLog";

const mappingSchema = z.object({ kind: z.enum(["income", "expense"]), date: z.number().int().positive(), bus: z.number().int().positive(), amount: z.number().int().positive().optional(), ticketCollection: z.number().int().positive().optional(), otherIncome: z.number().int().positive().optional(), category: z.number().int().positive().optional(), route: z.number().int().positive().optional(), trip: z.number().int().positive().optional(), otherIncomeType: z.number().int().positive().optional(), paymentMethod: z.number().int().positive().optional(), vendor: z.number().int().positive().optional(), notes: z.number().int().positive().optional(), dateFormat: z.enum(["yyyy-mm-dd", "dd/mm/yyyy", "mm/dd/yyyy"]) });
function cell(row: string[], index?: number) { return index ? row[index - 1]?.trim() ?? "" : ""; }
export async function POST(request: NextRequest) {
  const gate = await requirePermission("imports.manage"); if (gate.response) return gate.response;
  let parsedMapping: z.infer<typeof mappingSchema>;
  let file: File;
  try {
    const form = await request.formData(); const rawFile = form.get("file"); const rawMapping = form.get("mapping");
    if (!(rawFile instanceof File) || typeof rawMapping !== "string") return NextResponse.json({ error: "File and column mapping are required" }, { status: 400 });
    const json = JSON.parse(rawMapping); const result = mappingSchema.safeParse(json);
    if (!result.success) return NextResponse.json({ error: "Invalid column mapping", details: result.error.flatten() }, { status: 400 });
    parsedMapping = result.data; file = rawFile;
  } catch { return NextResponse.json({ error: "Could not read the import request" }, { status: 400 }); }
  if (parsedMapping.kind === "income" && !parsedMapping.ticketCollection) return NextResponse.json({ error: "Map the ticket collection column" }, { status: 400 });
  if (parsedMapping.kind === "expense" && (!parsedMapping.amount || !parsedMapping.category)) return NextResponse.json({ error: "Map the expense amount and category columns" }, { status: 400 });
  let notebook;
  try { notebook = await readNotebook(file); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read the file" }, { status: 400 }); }
  await connectDB();
  const [buses, categories] = await Promise.all([Bus.find({ deletedAt: null }).select("_id registrationNumber").lean(), ExpenseCategory.find({ isActive: true, deletedAt: null }).select("_id name slug").lean()]);
  const busMap = new Map(buses.map(bus => [bus.registrationNumber.replace(/\s/g, "").toUpperCase(), bus._id]));
  const categoryMap = new Map(categories.flatMap(category => [[category.name.toLowerCase(), category._id], [category.slug.toLowerCase(), category._id]]));
  const incomeDocs: Record<string, unknown>[] = []; const expenseDocs: Record<string, unknown>[] = []; const errors: { row: number; message: string }[] = [];
  for (const row of notebook.rows) {
    if (row.cells.every(value => !value)) continue;
    const date = parseNotebookDate(cell(row.cells, parsedMapping.date), parsedMapping.dateFormat);
    const busReg = cell(row.cells, parsedMapping.bus).replace(/\s/g, "").toUpperCase(); const bus = busMap.get(busReg);
    if (!date) { errors.push({ row: row.number, message: "Invalid date" }); continue; }
    if (!bus) { errors.push({ row: row.number, message: `Bus registration not found: ${busReg || "(empty)"}` }); continue; }
    if (parsedMapping.kind === "income") {
      const ticket = parseNotebookMoney(cell(row.cells, parsedMapping.ticketCollection)); const otherRaw = cell(row.cells, parsedMapping.otherIncome); const other = otherRaw ? parseNotebookMoney(otherRaw) : 0;
      if (ticket === null || ticket < 0 || other === null || other < 0) { errors.push({ row: row.number, message: "Invalid ticket or other income amount" }); continue; }
      incomeDocs.push({ date, bus, ticketCollectionMinor: ticket, otherIncomeMinor: other, otherIncomeType: cell(row.cells, parsedMapping.otherIncomeType), route: cell(row.cells, parsedMapping.route), trip: cell(row.cells, parsedMapping.trip), notes: cell(row.cells, parsedMapping.notes), createdBy: gate.session!.user.id, updatedBy: gate.session!.user.id });
    } else {
      const amountMinor = parseNotebookMoney(cell(row.cells, parsedMapping.amount)); const categoryRaw = cell(row.cells, parsedMapping.category).toLowerCase(); const category = categoryMap.get(categoryRaw);
      const methodRaw = cell(row.cells, parsedMapping.paymentMethod).toLowerCase(); const paymentMethod = ["cash", "bank", "card"].includes(methodRaw) ? methodRaw : "cash";
      if (amountMinor === null || amountMinor <= 0) { errors.push({ row: row.number, message: "Invalid expense amount" }); continue; }
      if (!category) { errors.push({ row: row.number, message: `Expense category not found: ${categoryRaw || "(empty)"}` }); continue; }
      expenseDocs.push({ date, bus, isShared: false, allocations: [{ bus, ratioBps: 10000, amountMinor }], category, amountMinor, currency: "LKR", paymentMethod, vendor: cell(row.cells, parsedMapping.vendor), notes: cell(row.cells, parsedMapping.notes), createdBy: gate.session!.user.id, updatedBy: gate.session!.user.id });
    }
  }
  if (errors.length && errors.length === notebook.totalRows) return NextResponse.json({ imported: 0, errors, error: "No valid rows to import" }, { status: 400 });
  const created = parsedMapping.kind === "income" ? await Income.insertMany(incomeDocs, { ordered: true }) : await Expense.insertMany(expenseDocs, { ordered: true });
  await AuditLog.create({ actor: gate.session!.user.id, action: "import", resource: parsedMapping.kind, newValue: { imported: created.length, skipped: errors.length, fileName: file.name } });
  return NextResponse.json({ imported: created.length, skipped: errors.length, errors: errors.slice(0, 100) }, { status: 201 });
}

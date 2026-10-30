import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { businessDateString, dateOnly } from "@/lib/business-date";
import { requirePermission } from "@/lib/permissions";
import Document from "@/models/Document";
import Employee from "@/models/Employee";
import MaintenanceRecord from "@/models/MaintenanceRecord";
import Bus from "@/models/Bus";
export async function GET() {
  const gate = await requirePermission("reminders.view"); if (gate.response) return gate.response;
  await connectDB(); const todayText = businessDateString(); const today = dateOnly(todayText)!; const horizon = new Date(today); horizon.setUTCDate(horizon.getUTCDate() + 30);
  const [documents, employees, services, buses] = await Promise.all([
    Document.find({ deletedAt: null, expiryDate: { $lte: new Date(today.getTime() + 365 * 86400000) } }).populate("bus", "name registrationNumber").populate("employee", "name role").sort({ expiryDate: 1 }).lean(),
    Employee.find({ deletedAt: null, isActive: true, licenseExpiry: { $ne: null, $lte: horizon } }).select("name role licenseExpiry").lean(),
    MaintenanceRecord.find({ deletedAt: null, $or: [{ nextServiceDate: { $ne: null, $lte: horizon } }] }).populate("bus", "name registrationNumber currentOdometerKm").sort({ nextServiceDate: 1 }).lean(),
    Bus.find({ deletedAt: null }).select("name registrationNumber currentOdometerKm").lean()
  ]);
  const items = [
    ...documents.filter(doc => { const cutoff = new Date(today); cutoff.setUTCDate(cutoff.getUTCDate() + (doc.reminderDays ?? 30)); return doc.expiryDate <= cutoff; }).map(doc => ({ id: String(doc._id), kind: "document", title: `${doc.kind.replaceAll("_", " ")} expires`, subject: (doc.bus as unknown as { name?: string } | null)?.name ?? (doc.employee as unknown as { name?: string } | null)?.name ?? "Business document", dueDate: doc.expiryDate.toISOString().slice(0, 10), expired: doc.expiryDate < today })),
    ...employees.map(employee => ({ id: String(employee._id), kind: "license", title: "Driver license expires", subject: `${employee.name} · ${employee.role}`, dueDate: employee.licenseExpiry!.toISOString().slice(0, 10), expired: employee.licenseExpiry! < today })),
    ...services.map(service => ({ id: String(service._id), kind: "maintenance", title: "Maintenance due", subject: (service.bus as unknown as { name?: string } | null)?.name ?? "Bus", dueDate: service.nextServiceDate!.toISOString().slice(0, 10), expired: service.nextServiceDate! < today }))
  ];
  const busById = new Map(buses.map(bus => [String(bus._id), bus]));
  for (const service of await MaintenanceRecord.find({ deletedAt: null, nextServiceOdometerKm: { $ne: null } }).select("bus nextServiceOdometerKm description").lean()) {
    const bus = busById.get(String(service.bus)); if (bus && (bus.currentOdometerKm ?? 0) >= (service.nextServiceOdometerKm ?? Infinity)) items.push({ id: String(service._id), kind: "maintenance", title: "Odometer service due", subject: `${bus.name} · ${service.description}`, dueDate: todayText, expired: false });
  }
  const uniqueItems = [...new Map(items.map(item => [`${item.kind}-${item.id}`, item])).values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return NextResponse.json({ today: todayText, items: uniqueItems, count: uniqueItems.length });
}

import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { businessDateString, dateOnly } from "@/lib/business-date";
import Income from "@/models/Income";
import Expense from "@/models/Expense";
import Bus from "@/models/Bus";

export type ReportType = "daily" | "monthly" | "yearly" | "buswise" | "compare" | "categories" | "fuel";
export type ReportFilters = { from: string; to: string; bus?: string; category?: string; employee?: string };
const zone = "Asia/Colombo";

function makeWindow(filters: ReportFilters) {
  const from = dateOnly(filters.from); const to = dateOnly(filters.to);
  if (!from || !to || from > to) throw new Error("Choose a valid start and end date");
  const end = new Date(to); end.setUTCDate(end.getUTCDate() + 1);
  const busId = filters.bus && Types.ObjectId.isValid(filters.bus) ? new Types.ObjectId(filters.bus) : undefined;
  if (filters.bus && !busId) throw new Error("Choose a valid bus");
  const categoryId = filters.category && Types.ObjectId.isValid(filters.category) ? new Types.ObjectId(filters.category) : undefined;
  if (filters.category && !categoryId) throw new Error("Choose a valid category");
  const employeeId = filters.employee && Types.ObjectId.isValid(filters.employee) ? new Types.ObjectId(filters.employee) : undefined;
  if (filters.employee && !employeeId) throw new Error("Choose a valid employee");
  return { start: from, end, busId, categoryId, employeeId };
}

function incomeMatch(start: Date, end: Date, busId?: Types.ObjectId, employeeId?: Types.ObjectId) {
  return { deletedAt: null, date: { $gte: start, $lt: end }, ...(busId ? { bus: busId } : {}), ...(employeeId ? { $or: [{ driver: employeeId }, { conductor: employeeId }] } : {}) };
}
function expensePipeline(start: Date, end: Date, busId?: Types.ObjectId, categoryId?: Types.ObjectId) {
  return [
    { $match: { deletedAt: null, date: { $gte: start, $lt: end }, ...(categoryId ? { category: categoryId } : {}) } },
    { $set: { reportAllocations: { $cond: [{ $gt: [{ $size: { $ifNull: ["$allocations", []] } }, 0] }, "$allocations", { $cond: [{ $ne: ["$bus", null] }, [{ bus: "$bus", amountMinor: "$amountMinor" }], []] }] } } },
    { $unwind: "$reportAllocations" },
    ...(busId ? [{ $match: { "reportAllocations.bus": busId } }] : [])
  ];
}
const incValue = { $add: [{ $ifNull: ["$ticketCollectionMinor", 0] }, { $ifNull: ["$otherIncomeMinor", 0] }] };
const dayKey = { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: zone } };
const monthKey = { $dateToString: { format: "%Y-%m", date: "$date", timezone: zone } };

async function aggregateByDate(start: Date, end: Date, busId?: Types.ObjectId, month = false, categoryId?: Types.ObjectId, employeeId?: Types.ObjectId) {
  const key = month ? monthKey : dayKey;
  const [incomes, expenses] = await Promise.all([
    Income.aggregate([{ $match: incomeMatch(start, end, busId, employeeId) }, { $group: { _id: key, amountMinor: { $sum: incValue }, trips: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Expense.aggregate([...expensePipeline(start, end, busId, categoryId), { $group: { _id: key, amountMinor: { $sum: "$reportAllocations.amountMinor" }, records: { $sum: 1 } } }, { $sort: { _id: 1 } }])
  ]);
  const byKey = new Map<string, { date: string; incomeMinor: number; expenseMinor: number; trips: number }>();
  for (const row of incomes) byKey.set(row._id, { date: row._id, incomeMinor: row.amountMinor, expenseMinor: 0, trips: row.trips });
  for (const row of expenses) { const item = byKey.get(row._id) ?? { date: row._id, incomeMinor: 0, expenseMinor: 0, trips: 0 }; item.expenseMinor = row.amountMinor; byKey.set(row._id, item); }
  return [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date)).map(row => ({ ...row, profitMinor: row.incomeMinor - row.expenseMinor }));
}

async function busSummary(start: Date, end: Date, onlyBus?: Types.ObjectId, categoryId?: Types.ObjectId, employeeId?: Types.ObjectId) {
  const busFilter = { deletedAt: null, ...(onlyBus ? { _id: onlyBus } : {}) };
  const buses = await Bus.find(busFilter).select("name registrationNumber currentOdometerKm").sort({ name: 1 }).lean();
  const [incomeRows, expenseRows] = await Promise.all([
    Income.aggregate([{ $match: incomeMatch(start, end, onlyBus, employeeId) }, { $group: { _id: "$bus", incomeMinor: { $sum: incValue }, days: { $addToSet: dayKey }, trips: { $sum: 1 } } }]),
    Expense.aggregate([...expensePipeline(start, end, onlyBus, categoryId), { $group: { _id: "$reportAllocations.bus", expenseMinor: { $sum: "$reportAllocations.amountMinor" }, firstOdometer: { $min: "$odometerKm" }, lastOdometer: { $max: "$odometerKm" } } }])
  ]);
  const incomeMap = new Map(incomeRows.map(row => [String(row._id), row])); const expenseMap = new Map(expenseRows.map(row => [String(row._id), row]));
  return buses.map(bus => {
    const income = incomeMap.get(String(bus._id)); const expense = expenseMap.get(String(bus._id));
    const incomeMinor = income?.incomeMinor ?? 0; const expenseMinor = expense?.expenseMinor ?? 0; const profitMinor = incomeMinor - expenseMinor;
    const km = typeof expense?.firstOdometer === "number" && typeof expense?.lastOdometer === "number" ? Math.max(0, expense.lastOdometer - expense.firstOdometer) : 0;
    const activeDays = income?.days?.length ?? 0;
    return { busId: String(bus._id), bus: bus.name, registrationNumber: bus.registrationNumber, incomeMinor, expenseMinor, profitMinor, marginPercent: incomeMinor ? Math.round(profitMinor / incomeMinor * 10000) / 100 : 0, costPerKmMinor: km ? Math.round(expenseMinor / km) : null, kmFromExpenseOdometers: km, incomePerDayMinor: activeDays ? Math.round(incomeMinor / activeDays) : 0, trips: income?.trips ?? 0 };
  });
}

async function categorySummary(start: Date, end: Date, busId?: Types.ObjectId, categoryId?: Types.ObjectId) {
  return Expense.aggregate([...expensePipeline(start, end, busId, categoryId), { $group: { _id: "$category", amountMinor: { $sum: "$reportAllocations.amountMinor" }, records: { $sum: 1 } } }, { $lookup: { from: "expensecategories", localField: "_id", foreignField: "_id", as: "categoryInfo" } }, { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } }, { $project: { _id: 0, categoryId: { $toString: "$_id" }, category: { $ifNull: ["$categoryInfo.name", "Deleted category"] }, amountMinor: 1, records: 1 } }, { $sort: { amountMinor: -1 } }]);
}

export async function getReport(type: ReportType, filters: ReportFilters) {
  await connectDB(); const { start, end, busId, categoryId, employeeId } = makeWindow(filters);
  if (type === "daily") {
    const [rows, buses] = await Promise.all([aggregateByDate(start, end, busId, false, categoryId, employeeId), busSummary(start, end, busId, categoryId, employeeId)]);
    return { rows, buses, totals: rows.reduce((sum, row) => ({ incomeMinor: sum.incomeMinor + row.incomeMinor, expenseMinor: sum.expenseMinor + row.expenseMinor, profitMinor: sum.profitMinor + row.profitMinor }), { incomeMinor: 0, expenseMinor: 0, profitMinor: 0 }) };
  }
  if (type === "monthly") {
    const [rows, categories] = await Promise.all([aggregateByDate(start, end, busId, false, categoryId, employeeId), categorySummary(start, end, busId, categoryId)]);
    return { rows, categories, totals: rows.reduce((sum, row) => ({ incomeMinor: sum.incomeMinor + row.incomeMinor, expenseMinor: sum.expenseMinor + row.expenseMinor, profitMinor: sum.profitMinor + row.profitMinor }), { incomeMinor: 0, expenseMinor: 0, profitMinor: 0 }) };
  }
  if (type === "yearly") return { rows: await aggregateByDate(start, end, busId, true, categoryId, employeeId) };
  if (type === "buswise" || type === "compare") return { rows: await busSummary(start, end, busId, categoryId, employeeId) };
  if (type === "categories") return { rows: await categorySummary(start, end, busId, categoryId) };
  if (type === "fuel") {
    const filter = { deletedAt: null, date: { $gte: start, $lt: end }, fuelLitres: { $gt: 0 }, ...(busId ? { bus: busId } : {}) };
    const rows = await Expense.aggregate([{ $match: filter }, { $group: { _id: "$bus", litres: { $sum: "$fuelLitres" }, costMinor: { $sum: "$amountMinor" }, firstOdometer: { $min: "$odometerKm" }, lastOdometer: { $max: "$odometerKm" }, fuelEntries: { $sum: 1 } } }, { $lookup: { from: "buses", localField: "_id", foreignField: "_id", as: "busInfo" } }, { $unwind: { path: "$busInfo", preserveNullAndEmptyArrays: true } }, { $project: { _id: 0, bus: { $ifNull: ["$busInfo.name", "Deleted bus"] }, registrationNumber: "$busInfo.registrationNumber", litres: 1, costMinor: 1, firstOdometer: 1, lastOdometer: 1, fuelEntries: 1, kmPerLitre: { $cond: [{ $and: [{ $gte: ["$firstOdometer", 0] }, { $gt: [{ $subtract: ["$lastOdometer", "$firstOdometer"] }, 0] }] }, { $divide: [{ $subtract: ["$lastOdometer", "$firstOdometer"] }, "$litres"] }, null] } } }, { $sort: { bus: 1 } }]);
    return { rows, note: "Kilometres per litre is estimated from the odometer range on fuel entries within this date range. Two or more odometer readings are needed." };
  }
  throw new Error("Unsupported report type");
}

export async function getDashboardSummary() {
  const todayText = businessDateString(); const today = dateOnly(todayText)!; const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); const lastMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const [todayRows, currentMonth, lastMonth, trend, buses, activeBuses] = await Promise.all([
    aggregateByDate(today, tomorrow),
    aggregateByDate(monthStart, tomorrow),
    aggregateByDate(lastMonthStart, monthStart),
    aggregateByDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1)), tomorrow, undefined, true),
    busSummary(monthStart, tomorrow),
    Bus.countDocuments({ deletedAt: null, status: "active" })
  ]);
  const totals = (rows: typeof todayRows) => rows.reduce((acc, row) => ({ incomeMinor: acc.incomeMinor + row.incomeMinor, expenseMinor: acc.expenseMinor + row.expenseMinor, profitMinor: acc.profitMinor + row.profitMinor }), { incomeMinor: 0, expenseMinor: 0, profitMinor: 0 });
  const todayTotals = totals(todayRows); const current = totals(currentMonth); const previous = totals(lastMonth);
  const sorted = [...buses].sort((a, b) => b.profitMinor - a.profitMinor);
  return { today: todayTotals, currentMonth: current, lastMonth: previous, activeBuses, trend, bestBus: sorted.find(bus => bus.incomeMinor > 0) ?? null, worstBus: [...sorted].reverse().find(bus => bus.incomeMinor > 0) ?? null, busProfit: buses };
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { dateOnly } from "@/lib/business-date";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
function escapeRegex(text: string) { return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
export async function GET(request: NextRequest) {
  const gate = await requirePermission("audit.view"); if (gate.response) return gate.response;
  await connectDB(); const query = request.nextUrl.searchParams; const page = Math.max(1, Math.min(10000, Number(query.get("page") ?? 1) || 1)); const limit = Math.max(10, Math.min(100, Number(query.get("limit") ?? 25) || 25));
  const filter: Record<string, unknown> = {};
  const resource = query.get("resource"); if (resource && resource.length <= 80) filter.resource = resource;
  const action = query.get("action"); if (action && action.length <= 80) filter.action = action;
  const from = query.get("from"); const to = query.get("to");
  if (from || to) { const lower = from ? dateOnly(from) : null; const upper = to ? dateOnly(to) : null; if ((from && !lower) || (to && !upper) || (lower && upper && lower > upper)) return NextResponse.json({ error: "Invalid date range" }, { status: 400 }); const date: Record<string, Date> = {}; if (lower) date.$gte = lower; if (upper) { const exclusive = new Date(upper); exclusive.setUTCDate(exclusive.getUTCDate() + 1); date.$lt = exclusive; } filter.createdAt = date; }
  const search = query.get("q")?.trim().slice(0, 100);
  if (search) { const regex = new RegExp(escapeRegex(search), "i"); const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select("_id").limit(100).lean(); filter.$or = [{ resource: regex }, { action: regex }, { resourceId: regex }, { actor: { $in: users.map(user => user._id) } }]; }
  const sort = query.get("sort") === "oldest" ? 1 : -1;
  const [logs, total] = await Promise.all([AuditLog.find(filter).populate("actor", "name email").sort({ createdAt: sort, _id: sort }).skip((page - 1) * limit).limit(limit).lean(), AuditLog.countDocuments(filter)]);
  return NextResponse.json({ logs, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
}

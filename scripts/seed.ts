import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import Role from "../models/Role";
import Permission from "../models/Permission";
import User from "../models/User";

const permissionRows = ["income.create", "income.view", "income.edit", "income.delete", "expense.create", "expense.view", "expense.edit", "expense.delete", "reports.view", "buses.manage", "employees.manage", "users.manage", "settings.manage", "audit.view"];
const roleRows = [
  { name: "owner", label: "Owner", description: "Full access to all records, settings and team access.", permissions: permissionRows },
  { name: "manager", label: "Manager / Accountant", description: "Manage daily financial entries and view all reports.", permissions: ["income.create", "income.view", "income.edit", "expense.create", "expense.view", "expense.edit", "reports.view"] },
  { name: "driver", label: "Driver / Conductor", description: "Add assigned-bus collection and expenses for today.", permissions: ["income.create", "expense.create"] },
  { name: "viewer", label: "Viewer", description: "Read-only access to reports.", permissions: ["income.view", "expense.view", "reports.view"] }
];

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw new Error("Owner password must be 12+ chars and include upper/lowercase, number and symbol");
  await connectDB();
  for (const row of permissionRows) { const [resource, action] = row.split("."); await Permission.updateOne({ key: row }, { $set: { resource, action }, $setOnInsert: { description: `${action} ${resource}` } }, { upsert: true }); }
  const roleMap = new Map<string, string>();
  for (const row of roleRows) { const role = await Role.findOneAndUpdate({ name: row.name }, { $set: { ...row, isSystem: true } }, { upsert: true, new: true, setDefaultsOnInsert: true }); roleMap.set(row.name, String(role._id)); }
  const existing = await User.findOne({ email });
  if (!existing) await User.create({ name: "Business Owner", email, passwordHash: await bcrypt.hash(password, 12), role: roleMap.get("owner"), isActive: true });
  console.log(`Seed complete. Owner ${existing ? "already exists" : "created"}: ${email}`);
  process.exit(0);
}
seed().catch(error => { console.error(error); process.exit(1); });

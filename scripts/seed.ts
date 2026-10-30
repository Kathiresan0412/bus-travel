import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import Role from "../models/Role";
import Permission from "../models/Permission";
import User from "../models/User";
import ExpenseCategory from "../models/ExpenseCategory";
import Bus from "../models/Bus";

const permissionRows = ["income.create", "income.view", "income.edit", "income.delete", "expense.create", "expense.view", "expense.edit", "expense.delete", "categories.manage", "reports.view", "buses.manage", "employees.manage", "users.manage", "settings.manage", "audit.view", "salaries.manage", "loans.manage", "maintenance.manage", "documents.manage", "reminders.view", "imports.manage"];
const expenseCategories = ["Fuel", "Driver Salary", "Conductor Salary", "Maintenance and Repair", "Spare Parts", "Tyres", "Insurance", "Road Tax and Permit", "Fines", "Toll/Parking", "Loan/Lease Installment", "Washing", "Commission", "Other"];
const roleRows = [
  { name: "owner", label: "Owner", description: "Full access to all records, settings and team access.", permissions: permissionRows },
  { name: "manager", label: "Manager / Accountant", description: "Manage daily financial records, payroll, loans and fleet operations.", permissions: ["income.create", "income.view", "income.edit", "expense.create", "expense.view", "expense.edit", "reports.view", "salaries.manage", "loans.manage", "maintenance.manage", "documents.manage", "reminders.view", "imports.manage"] },
  { name: "driver", label: "Driver / Conductor", description: "Add and review assigned-bus collection and expenses for today.", permissions: ["income.create", "income.view", "expense.create", "expense.view"] },
  { name: "viewer", label: "Viewer", description: "Read-only access to reports.", permissions: ["income.view", "expense.view", "reports.view"] }
];

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set");
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw new Error("Owner password must be 12+ chars and include upper/lowercase, number and symbol");
  await connectDB();
  for (const row of permissionRows) { const [resource, action] = row.split("."); await Permission.updateOne({ key: row }, { $set: { resource, action }, $setOnInsert: { description: `${action} ${resource}` } }, { upsert: true }); }
  for (const name of expenseCategories) { const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); await ExpenseCategory.updateOne({ slug }, { $setOnInsert: { name, slug, isDefault: true } }, { upsert: true }); }
  const roleMap = new Map<string, string>();
  for (const row of roleRows) { const role = await Role.findOneAndUpdate({ name: row.name }, { $set: { ...row, isSystem: true } }, { upsert: true, new: true, setDefaultsOnInsert: true }); roleMap.set(row.name, String(role._id)); }
  const existing = await User.findOne({ email });
  const owner = existing ?? await User.create({ name: "Business Owner", email, passwordHash: await bcrypt.hash(password, 12), role: roleMap.get("owner"), isActive: true });
  if (process.env.SEED_SAMPLE_BUSES === "true") {
    const examples = [{ name: "City Runner", registrationNumber: "DEMO-001", route: "Town Centre – Main Station" }, { name: "Coastal Express", registrationNumber: "DEMO-002", route: "Town Centre – Coast" }, { name: "Hill Country", registrationNumber: "DEMO-003", route: "Town Centre – Hill District" }, { name: "Airport Link", registrationNumber: "DEMO-004", route: "Town Centre – Airport" }];
    for (const bus of examples) await Bus.updateOne({ registrationNumber: bus.registrationNumber }, { $setOnInsert: { ...bus, createdBy: owner._id, updatedBy: owner._id } }, { upsert: true });
  }
  console.log(`Seed complete. Owner ${existing ? "already exists" : "created"}: ${email}`);
  process.exit(0);
}
seed().catch(error => { console.error(error); process.exit(1); });

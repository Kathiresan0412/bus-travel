import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import UsersClient from "./users-client";

export default async function UsersPage() {
  const session = await auth(); if (!session?.user.permissions.includes("users.manage")) redirect("/dashboard");
  await connectDB();
  const [users, roles] = await Promise.all([User.find({ deletedAt: null }).select("name email role isActive createdAt").populate("role", "name label").sort({ createdAt: -1 }).lean(), Role.find().select("name label").sort({ name: 1 }).lean()]);
  const safeUsers = users.map(u => ({ id: String(u._id), name: u.name, email: u.email, role: (u.role as unknown as { name: string; label: string })?.name ?? "", roleLabel: (u.role as unknown as { name: string; label: string })?.label ?? "", isActive: u.isActive, createdAt: u.createdAt.toISOString() }));
  return <UsersClient initialUsers={safeUsers} roles={roles.map(r => ({ id: String(r._id), name: r.name, label: r.label }))}/>;
}

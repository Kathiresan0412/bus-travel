import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireOwner } from "@/lib/permissions";
import Role from "@/models/Role";
import Permission from "@/models/Permission";
export async function GET() {
  const gate = await requireOwner(); if (gate.response) return gate.response;
  await connectDB();
  const [roles, permissions] = await Promise.all([Role.find().sort({ name: 1 }).lean(), Permission.find().sort({ resource: 1, action: 1 }).lean()]);
  return NextResponse.json({ roles, permissions });
}

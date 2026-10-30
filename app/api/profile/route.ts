import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { passwordSchema } from "@/validations/auth";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  currentPassword: z.string().min(1).max(128),
  newPassword: z.union([passwordSchema, z.literal("")]).optional()
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile details", details: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const user = await User.findOne({ _id: session.user.id, isActive: true, deletedAt: null }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }
  const duplicate = await User.exists({ email: parsed.data.email, _id: { $ne: user._id }, deletedAt: null });
  if (duplicate) return NextResponse.json({ error: "Email is already in use" }, { status: 409 });

  const oldValue = { name: user.name, email: user.email };
  user.name = parsed.data.name;
  user.email = parsed.data.email;
  if (parsed.data.newPassword) user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  user.updatedBy = user._id;
  await user.save();
  await AuditLog.create({ actor: user._id, action: "update", resource: "user", resourceId: user.id, oldValue, newValue: { name: user.name, email: user.email, passwordChanged: Boolean(parsed.data.newPassword) } });
  return NextResponse.json({ user: { name: user.name, email: user.email } });
}

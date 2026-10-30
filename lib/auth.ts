import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import LoginAttempt from "@/models/LoginAttempt";
import { loginSchema } from "@/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(raw, request) {
      const input = loginSchema.safeParse(raw);
      if (!input.success) return null;
      await connectDB();
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const key = createHash("sha256").update(`${ip}:${input.data.email}`).digest("hex");
      const attempt = await LoginAttempt.findOne({ key }).lean();
      if (attempt?.lockedUntil && attempt.lockedUntil.getTime() > Date.now()) return null;
      if (attempt && Date.now() - attempt.windowStartedAt.getTime() >= 15 * 60 * 1000) await LoginAttempt.deleteOne({ key });
      const user = await User.findOne({ email: input.data.email, isActive: true, deletedAt: null }).select("+passwordHash");
      if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) {
        const now = new Date(); const expired = !attempt || now.getTime() - attempt.windowStartedAt.getTime() >= 15 * 60 * 1000;
        const count = expired ? 1 : attempt.count + 1;
        await LoginAttempt.findOneAndUpdate({ key }, { $set: { count, windowStartedAt: expired ? now : attempt.windowStartedAt, lockedUntil: count >= 5 ? new Date(now.getTime() + 15 * 60 * 1000) : null, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } }, { upsert: true, new: true });
        return null;
      }
      await LoginAttempt.deleteOne({ key });
      const role = await Role.findById(user.role).lean();
      if (!role) return null;
      return { id: user.id, name: user.name, email: user.email, role: role.name, permissions: role.permissions };
    }
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.userId = user.id; token.role = user.role; token.permissions = user.permissions; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.userId!; session.user.role = token.role ?? ""; session.user.permissions = token.permissions ?? []; }
      return session;
    }
  },
  cookies: { sessionToken: { name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token", options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" } } }
});

import "next-auth";
declare module "next-auth" {
  interface Session { user: { id: string; role: string; permissions: string[] } & NonNullable<Session["user"]> }
  interface User { role?: string; permissions?: string[] }
}
declare module "next-auth/jwt" {
  interface JWT { userId?: string; role?: string; permissions?: string[] }
}

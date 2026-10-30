import { z } from "zod";
export const loginSchema = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });
export const passwordSchema = z.string().min(12).max(128).regex(/[a-z]/, "Include a lowercase letter").regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number").regex(/[^A-Za-z0-9]/, "Include a symbol");

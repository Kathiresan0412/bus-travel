"use client";
import { signOut } from "next-auth/react";
export default function SignOutButton() { return <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100">Sign out</button>; }

"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { BusFront, LoaderCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: data.get("email"), password: data.get("password"), redirect: false });
    if (result?.error) { setError("Email or password was not recognized."); setBusy(false); }
    else window.location.assign("/dashboard");
  }
  return <main className="flex min-h-screen items-center justify-center px-3 py-6 sm:px-5 sm:py-10">
    <div className="grid w-full max-w-4xl overflow-hidden rounded-[26px] bg-white shadow-card md:grid-cols-2">
      <section className="flex min-h-[260px] flex-col justify-between bg-forest p-6 text-white sm:min-h-[320px] sm:p-9 md:min-h-[500px] md:p-12">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><BusFront size={23}/></span><span className="font-semibold tracking-tight">RouteLedger</span></div>
        <div><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-emerald-200">Your business, in view</p><h1 className="max-w-sm text-4xl font-semibold leading-tight">Know where every rupee goes.</h1><p className="mt-4 max-w-sm leading-7 text-emerald-50/75">A clear, calm place to manage your bus operation’s finances.</p></div>
        <p className="text-xs text-white/50">Private workspace for your transport business</p>
      </section>
      <section className="flex flex-col justify-center p-6 sm:p-8 md:p-12"><p className="text-sm font-semibold text-forest">Welcome back</p><h2 className="mt-2 text-2xl font-semibold">Sign in to your account</h2><p className="mt-2 text-sm text-slate-500">Use the account created by your owner.</p>
        <form onSubmit={submit} className="mt-8 space-y-5"><div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" name="email" type="email" autoComplete="username" required placeholder="you@company.com"/></div><div><label className="label" htmlFor="password">Password</label><input className="field" id="password" name="password" type="password" autoComplete="current-password" required placeholder="Your password"/></div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 font-semibold text-white transition hover:bg-[#103b2b] disabled:opacity-70">{busy && <LoaderCircle size={17} className="animate-spin"/>}Sign in</button>
        </form><p className="mt-7 text-center text-xs leading-5 text-slate-400">Need access? Ask the business owner to invite you.</p>
      </section>
    </div>
  </main>;
}

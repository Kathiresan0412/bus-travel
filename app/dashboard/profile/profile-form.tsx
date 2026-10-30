"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";

export default function ProfileForm({ name, email }: { name: string; email: string }) {
  const { update } = useSession();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not update profile"); setBusy(false); return; }
    await update();
    (form.elements.namedItem("name") as HTMLInputElement).value = result.user.name;
    (form.elements.namedItem("email") as HTMLInputElement).value = result.user.email;
    (form.elements.namedItem("currentPassword") as HTMLInputElement).value = "";
    (form.elements.namedItem("newPassword") as HTMLInputElement).value = "";
    setMessage("Profile updated successfully."); setBusy(false);
  }

  return <form onSubmit={save} className="panel mt-7 max-w-2xl space-y-5 p-4 sm:p-6">
    <section className="space-y-4">
      <h2 className="font-semibold">Personal details</h2>
      <div><label className="label" htmlFor="name">Full name</label><input className="field" id="name" name="name" defaultValue={name} required maxLength={100}/></div>
      <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" name="email" type="email" defaultValue={email} required maxLength={254}/></div>
    </section>
    <section className="space-y-4 border-t border-slate-100 pt-5">
      <div><h2 className="font-semibold">Change password</h2><p className="mt-1 text-xs text-slate-500">Leave the new password blank to keep your current password.</p></div>
      <div><label className="label" htmlFor="currentPassword">Current password</label><input className="field" id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/></div>
      <div><label className="label" htmlFor="newPassword">New password</label><input className="field" id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128}/><p className="mt-1 text-xs text-slate-400">At least 12 characters, with upper/lowercase, a number and symbol.</p></div>
    </section>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    <div className="flex justify-end border-t border-slate-100 pt-5"><button disabled={busy} className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button></div>
  </form>;
}

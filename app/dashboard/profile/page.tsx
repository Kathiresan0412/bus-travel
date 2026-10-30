import { auth } from "@/lib/auth";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  return <><div><p className="text-sm text-slate-500">Account settings</p><h1 className="mt-1 text-3xl font-semibold">My profile</h1><p className="mt-2 text-sm text-slate-500">Update your sign-in details and personal information.</p></div><ProfileForm name={session?.user.name ?? ""} email={session?.user.email ?? ""}/></>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useI18n, fmt } from "@/lib/i18n";
import { showToast } from "@/lib/nano-states";

type Profile = { email: string; displayName: string; provider: string; hasPassword: boolean };
type PasswordError = "wrong-current" | "weak" | "mismatch" | "no-password" | "generic";

const input = "mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20";
const button = "inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50";

export default function ProfileSettingsPage() {
  const { t } = useI18n();
  const P = t.settings.profile;
  const { update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<PasswordError | null>(null);

  useEffect(() => {
    fetch("/api/settings/profile").then(async (r) => {
      if (!r.ok) return;
      const p = (await r.json()) as Profile;
      setProfile(p);
      setName(p.displayName);
    });
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const r = await fetch("/api/settings/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: name }) }).catch(() => null);
    setSavingName(false);
    if (!r?.ok) { showToast(P.errors.generic, "error"); return; }
    await update({ displayName: name.trim() });
    showToast(P.nameSaved, "success");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next !== again) { setPwError("mismatch"); return; }
    if (next.length < 8) { setPwError("weak"); return; }
    setSavingPw(true);
    setPwError(null);
    const r = await fetch("/api/settings/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }) }).catch(() => null);
    setSavingPw(false);
    if (!r?.ok) {
      const code = ((await r?.json().catch(() => ({}))) as { error?: string })?.error;
      setPwError(code && code in P.errors ? (code as PasswordError) : "generic");
      return;
    }
    setCurrent(""); setNext(""); setAgain("");
    showToast(P.passwordChanged, "success");
  }

  const providerName = profile ? P.providers[profile.provider] ?? profile.provider : "";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
          {t.settings.backToProjects}
        </Link>

        <form onSubmit={saveName} className="bg-white shadow sm:rounded-lg border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">{P.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{P.desc}</p>
          </div>
          <div className="p-6 space-y-5">
            <label className="block text-sm font-semibold text-slate-700">
              {P.displayName}
              <input className={input} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} disabled={!profile} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{P.displayNameHint}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><div className="font-semibold text-slate-700">{P.email}</div><div className="mt-1 text-slate-600 break-all">{profile?.email ?? "…"}</div></div>
              <div><div className="font-semibold text-slate-700">{P.signInMethod}</div><div className="mt-1 text-slate-600">{providerName || "…"}</div></div>
            </div>
            <button type="submit" className={button} disabled={!profile || savingName || !name.trim() || name.trim() === profile?.displayName}>
              {savingName ? P.saving : P.saveName}
            </button>
          </div>
        </form>

        <div className="bg-white shadow sm:rounded-lg border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">{P.passwordTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{P.passwordDesc}</p>
          </div>
          {profile && !profile.hasPassword ? (
            <div className="p-6 text-sm text-slate-600 space-y-3">
              <p>{fmt(P.noPasswordBody, { provider: providerName })}</p>
              <Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">{P.setPasswordLink}</Link>
            </div>
          ) : (
            <form onSubmit={changePassword} className="p-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                {P.currentPassword}
                <input type="password" autoComplete="current-password" className={input} value={current} onChange={(e) => setCurrent(e.target.value)} required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {P.newPassword}
                <input type="password" autoComplete="new-password" minLength={8} className={input} value={next} onChange={(e) => setNext(e.target.value)} required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {P.confirmPassword}
                <input type="password" autoComplete="new-password" className={input} value={again} onChange={(e) => setAgain(e.target.value)} required />
              </label>
              {pwError && <p role="alert" className="text-sm text-red-600">{P.errors[pwError]}</p>}
              <button type="submit" className={button} disabled={savingPw || !current || !next || !again}>
                {savingPw ? P.saving : P.changePassword}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

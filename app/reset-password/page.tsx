"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { clearSignedIn } from "@/lib/session";
import AuthShell from "../components/AuthShell";

function ResetPasswordForm() {
    const token = useSearchParams().get("token") ?? "";
    const [form, setForm] = useState({ newPassword: "", repeatPassword: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        if (form.newPassword !== form.repeatPassword) { setError("Yeni şifreler birbiriyle aynı değil."); return; }
        setSaving(true); setError("");
        try {
            const response = await api.post<{ message: string }>("/auth/reset-password", { token, newPassword: form.newPassword });
            // Sıfırlama hesabın bütün oturumlarını kapatır; bu tarayıcıdaki işaret de temizlenir.
            clearSignedIn();
            setDone(response.data.message);
        } catch (error) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Şifre değiştirilemedi."
                : "Şifre değiştirilemedi.");
        } finally { setSaving(false); }
    }

    if (!token) return <>
        <h1>Bağlantı eksik</h1>
        <p role="alert" className="deleteError">Bu sayfa e-postadaki bağlantıyla açılmalı.</p>
        <p className="auth-footer"><Link href="/forgot-password">Yeni bağlantı iste</Link></p>
    </>;
    if (done) return <>
        <h1>Şifren değişti</h1>
        <p role="status" className="notice-success">{done}</p>
        <p className="auth-footer"><Link href="/">Giriş yap</Link></p>
    </>;
    return <>
        <p className="eyebrow">YENİ ŞİFRE</p>
        <h1>Yeni şifreni belirle</h1>
        <p className="auth-description">En az 6 karakter. Şifre değişince açık olan bütün oturumların kapanır.</p>
        <form onSubmit={handleSubmit}>
            <fieldset disabled={saving} className="registration-fields">
                <label htmlFor="resetNewPassword">Yeni şifre</label>
                <input id="resetNewPassword" type="password" autoComplete="new-password" required minLength={6}
                    value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
                <label htmlFor="resetRepeatPassword">Yeni şifre (tekrar)</label>
                <input id="resetRepeatPassword" type="password" autoComplete="new-password" required minLength={6}
                    value={form.repeatPassword} onChange={e => setForm({ ...form, repeatPassword: e.target.value })} />
                {error && <p role="alert" className="deleteError">{error}</p>}
                <button className="button-primary" type="submit">{saving ? "Kaydediliyor..." : "Şifreyi değiştir"}</button>
                {error && <p className="auth-footer"><Link href="/forgot-password">Yeni bağlantı iste</Link></p>}
            </fieldset>
        </form>
    </>;
}

export default function ResetPasswordPage() {
    return <AuthShell>
        <Suspense fallback={<p role="status">Yükleniyor...</p>}><ResetPasswordForm /></Suspense>
    </AuthShell>;
}

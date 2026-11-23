"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "../../components/AuthProvider";

const EMPTY = { currentPassword: "", newPassword: "", repeatPassword: "" };

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, loading, error: authError, reload } = useAuth();
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (!loading && !authError && !user) router.replace("/");
    }, [loading, authError, user, router]);
    if (loading) return <main><p role="status">Yükleniyor...</p></main>;
    if (authError) return <main><p role="alert">{authError}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setDone(false);
        if (form.newPassword !== form.repeatPassword) { setError("Yeni şifreler birbiriyle aynı değil."); return; }
        if (form.newPassword === form.currentPassword) { setError("Yeni şifre mevcut şifreyle aynı olamaz."); return; }
        setSaving(true); setError("");
        try {
            // Tekrar alanı yalnız ekranda kontrol edilir; sunucuya gönderilmez.
            await api.put("/users/me/password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
            setForm(EMPTY); setDone(true);
        } catch (error) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Şifre değiştirilemedi."
                : "Şifre değiştirilemedi.");
        } finally { setSaving(false); }
    }

    return <main>
        <h1>Şifremi değiştir</h1>
        <p>Güvenliğin için önce mevcut şifreni gir. Yeni şifre en az 6 karakter olmalı. Şifre değişince diğer cihazlardaki oturumların kapanır.</p>
        {error && <p role="alert" className="error-box">{error}</p>}
        {done && <p role="status" className="notice-success">Şifren değiştirildi. Diğer cihazlardaki oturumların kapatıldı; bu cihazda oturumun açık kalıyor.</p>}
        <form onSubmit={handleSubmit}><fieldset disabled={saving} className="registration-fields">
            <label htmlFor="currentPassword">Mevcut şifre</label>
            <input id="currentPassword" type="password" autoComplete="current-password" required
                value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
            <label htmlFor="newPassword">Yeni şifre</label>
            <input id="newPassword" type="password" autoComplete="new-password" required minLength={6}
                value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
            <label htmlFor="repeatPassword">Yeni şifre (tekrar)</label>
            <input id="repeatPassword" type="password" autoComplete="new-password" required minLength={6}
                value={form.repeatPassword} onChange={e => setForm({ ...form, repeatPassword: e.target.value })} />
            <div><button type="submit">{saving ? "Kaydediliyor..." : "Şifreyi değiştir"}</button>
                <button type="button" onClick={() => router.push("/profile")}>Profile dön</button></div>
        </fieldset></form>
    </main>;
}

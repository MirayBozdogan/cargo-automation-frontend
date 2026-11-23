"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import AuthShell from "../components/AuthShell";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (sending) return;
        setSending(true); setError(""); setSent("");
        try {
            const response = await api.post<{ message: string }>("/auth/forgot-password", { email: email.trim() });
            setSent(response.data.message);
        } catch (error) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "İstek gönderilemedi. Lütfen tekrar deneyin."
                : "İstek gönderilemedi. Lütfen tekrar deneyin.");
        } finally { setSending(false); }
    }

    return <AuthShell>
        <p className="eyebrow">ŞİFREMİ UNUTTUM</p>
        <h1>Şifreni sıfırla</h1>
        <p className="auth-description">Hesabının e-posta adresini yaz. Sana 30 dakika geçerli, tek kullanımlık bir bağlantı gönderelim.</p>
        {sent ? <>
            <p role="status" className="notice-success">{sent}</p>
            <p className="auth-footer">E-posta birkaç dakika içinde gelmezse gereksiz klasörüne bak veya tekrar dene.</p>
            <p className="auth-footer"><Link href="/">Giriş ekranına dön</Link></p>
        </> : <form onSubmit={handleSubmit}>
            <fieldset disabled={sending} className="registration-fields">
                <label htmlFor="forgotEmail">E-posta</label>
                <input id="forgotEmail" type="email" autoComplete="email" required placeholder="ornek@eposta.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                {error && <p role="alert" className="deleteError">{error}</p>}
                <button className="button-primary" type="submit">{sending ? "Gönderiliyor..." : "Bağlantı gönder"}</button>
                <p className="auth-footer"><Link href="/">Giriş ekranına dön</Link></p>
            </fieldset>
        </form>}
    </AuthShell>;
}

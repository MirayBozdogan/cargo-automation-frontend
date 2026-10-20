"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import AuthShell from "./components/AuthShell";

function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchParams = useSearchParams();
    const sessionExpired = searchParams.get("session") === "expired";

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;
        setError("");
        setIsSubmitting(true);
        try {
            const response = await api.post<string>("/auth/login", {
                email: email.trim(), password,
            });
            localStorage.setItem("token", response.data);
            router.replace("/profile");
        } catch (error: unknown) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Giriş yapılamadı. Lütfen tekrar deneyin."
                : "Beklenmeyen bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return <AuthShell>
        <p className="eyebrow">TEKRAR MERHABA</p>
        <h1>Hesabına giriş yap</h1>
        <p className="auth-description">Gönderilerini ve adreslerini yönetmek için giriş yap.</p>
        {sessionExpired && <p role="status">Oturumun sona erdi. Lütfen yeniden giriş yap.</p>}
        <form onSubmit={handleLogin}>
            <fieldset disabled={isSubmitting} className="registration-fields">
                <label htmlFor="loginEmail">E-posta</label>
                <input id="loginEmail" type="email" autoComplete="username" required
                    placeholder="ornek@eposta.com" value={email} onChange={e => setEmail(e.target.value)} />
                <label htmlFor="loginPassword">Şifre</label>
                <input id="loginPassword" type="password" autoComplete="current-password" required
                    placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} />
                {error && <p role="alert" className="deleteError">{error}</p>}
                <button className="button-primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
                <p className="auth-footer">Henüz hesabın yok mu? <button className="button-link" type="button" onClick={() => router.push("/register")}>Kayıt ol</button></p>
            </fieldset>
        </form>
    </AuthShell>;
}

export default function LoginPage() {
    return <Suspense fallback={<main><p>Giriş ekranı yükleniyor...</p></main>}>
        <LoginForm />
    </Suspense>;
}

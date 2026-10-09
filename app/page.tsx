"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

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

    return <main>
        <h1>Giriş Yap</h1>
        {sessionExpired && <p role="status">Oturumun sona erdi. Lütfen yeniden giriş yap.</p>}
        <form onSubmit={handleLogin}>
            <fieldset disabled={isSubmitting} className="registration-fields">
                <label htmlFor="loginEmail">E-posta</label>
                <input id="loginEmail" type="email" autoComplete="username" required
                    placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <label htmlFor="loginPassword">Şifre</label>
                <input id="loginPassword" type="password" autoComplete="current-password" required
                    placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} />
                {error && <p role="alert" className="deleteError">{error}</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
                <button type="button" onClick={() => router.push("/register")}>Kayıt Ol</button>
            </fieldset>
        </form>
    </main>;
}

export default function LoginPage() {
    return <Suspense fallback={<main><p>Giriş ekranı yükleniyor...</p></main>}>
        <LoginForm />
    </Suspense>;
}

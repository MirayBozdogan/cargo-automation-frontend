"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";

function LoginForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const searchParams = useSearchParams();
    const sessionExpired = searchParams.get("session") === "expired";

    const handleLogin = async () => {
        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const token = response.data;

            localStorage.setItem("token", token);

            router.replace("/profile");
        } catch (error) {
            console.error(error);
            alert("Email veya şifre hatalı.");
        }
    };

    const handleRegister = () => {
        router.push("/register");
    };

    return (
        <main>
            <h1>Giriş Yap</h1>
            {sessionExpired && <p role="status">Oturumun sona erdi. Lütfen yeniden giriş yap.</p>}

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin}>
                Giriş Yap
            </button>

            <button onClick={handleRegister}>
                Kayıt Ol
            </button>
        </main>
    );
}

export default function LoginPage() {
    return <Suspense fallback={<main><p>Giriş ekranı yükleniyor...</p></main>}>
        <LoginForm />
    </Suspense>;
}

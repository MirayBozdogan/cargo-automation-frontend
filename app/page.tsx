"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface JwtPayload {
    id: number;
}

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const token = response.data;

            localStorage.setItem("token", token);

            const payload: JwtPayload = JSON.parse(
                atob(token.split(".")[1])
            );

            router.push(`/users`);
        } catch (error) {
            console.error(error);
            alert("Email veya şifre hatalı.");
        }
    };

    const handleRegister = () => {
        router.push("/users/new");
    };

    return (
        <main>
            <h1>Giriş Yap</h1>

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
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: "", surname: "", email: "", age: "18",
        tc: "", telNo: "", password: "",
    });
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;
        setError("");
        if (form.password !== passwordConfirmation) {
            setError("Şifreler eşleşmiyor.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post("/auth/register", {
                ...form,
                name: form.name.trim(), surname: form.surname.trim(),
                email: form.email.trim(), age: Number(form.age),
            });
            setForm({ name: "", surname: "", email: "", age: "18", tc: "", telNo: "", password: "" });
            setPasswordConfirmation("");
            setRegistered(true);
        } catch (error: unknown) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Kayıt yapılamadı. Lütfen tekrar deneyin."
                : "Beklenmeyen bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (registered) {
        return <main>
            <h1>Kayıt tamamlandı</h1>
            <p role="status">Hesabın oluşturuldu. E-posta adresin ve şifrenle giriş yapabilirsin.</p>
            <Link href="/">Giriş yap</Link>
        </main>;
    }

    return <main>
        <h1>Müşteri Kaydı</h1>
        <form onSubmit={handleSubmit}>
            <fieldset disabled={isSubmitting} className="registration-fields">
                <label htmlFor="name">Ad</label>
                <input id="name" autoComplete="given-name" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                <label htmlFor="surname">Soyad</label>
                <input id="surname" autoComplete="family-name" required value={form.surname}
                    onChange={e => setForm({ ...form, surname: e.target.value })} />
                <label htmlFor="email">E-posta</label>
                <input id="email" type="email" autoComplete="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                <label htmlFor="age">Yaş</label>
                <input id="age" type="number" min={18} step={1} required value={form.age}
                    onChange={e => setForm({ ...form, age: e.target.value })} />
                <label htmlFor="tc">TC kimlik numarası</label>
                <input id="tc" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} required value={form.tc}
                    onChange={e => setForm({ ...form, tc: e.target.value })} />
                <label htmlFor="telNo">Telefon</label>
                <input id="telNo" type="tel" autoComplete="tel" pattern="05[0-9]{9}" maxLength={11}
                    placeholder="05XXXXXXXXX" required value={form.telNo}
                    onChange={e => setForm({ ...form, telNo: e.target.value })} />
                <label htmlFor="password">Şifre (en az 6 karakter)</label>
                <input id="password" type="password" autoComplete="new-password" minLength={6} required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                <label htmlFor="passwordConfirmation">Şifre tekrar</label>
                <input id="passwordConfirmation" type="password" autoComplete="new-password" minLength={6} required
                    value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} />
                {error && <p role="alert" className="deleteError">{error}</p>}
                <button type="submit">{isSubmitting ? "Kaydediliyor..." : "Kayıt ol"}</button>
            </fieldset>
        </form>
        <p>Zaten hesabın var mı? <Link href="/">Giriş yap</Link></p>
    </main>;
}

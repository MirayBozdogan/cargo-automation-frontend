"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth, type CurrentUser } from "../../../components/AuthProvider";

interface UserRequest {
    name: string; surname: string; email: string; age: number; tc: string; telNo: string;
}

export default function EditUserPage() {
    const { id } = useParams<{ id: string }>();
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [user, loading, error, router]);
    if (loading) return <main><p role="status">Kullanıcı bilgileri yükleniyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (String(user.id) !== id) return <main><p role="alert">Bu kullanıcının bilgilerini düzenleyemezsiniz.</p></main>;
    return <EditUserForm key={user.id} user={user} />;
}

function EditUserForm({ user }: { user: CurrentUser }) {
    const router = useRouter();
    const { logout, reload } = useAuth();
    // API yanıtındaki role, active ve id gibi alanlar güncelleme isteğine taşınmaz.
    const [form, setForm] = useState<UserRequest>({
        name: user.name, surname: user.surname, email: user.email, age: user.age,
        tc: user.tc ?? "", telNo: user.telNo ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setSaving(true); setError("");
        try {
            await api.put(`/users/${user.id}`, form);
            // JWT konusu e-postadır. Değiştiğinde eski token artık bu hesabı bulamaz.
            if (form.email !== user.email) {
                logout();
                return;
            }
            reload(); router.replace("/profile");
        } catch (error) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Kullanıcı güncellenemedi."
                : "Kullanıcı güncellenemedi.");
        } finally { setSaving(false); }
    }
    return <main>
        <h1>Kullanıcı Düzenle</h1>
        <p>E-posta adresini değiştirirsen yeni adresinle tekrar giriş yapman gerekir.</p>
        {error && <p role="alert" className="error-box">{error}</p>}
        <form onSubmit={handleSubmit}><fieldset disabled={saving} className="registration-fields">
            <label htmlFor="editName">Ad</label>
            <input id="editName" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <label htmlFor="editSurname">Soyad</label>
            <input id="editSurname" required value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} />
            <label htmlFor="editEmail">E-posta</label>
            <input id="editEmail" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <label htmlFor="editAge">Yaş</label>
            <input id="editAge" type="number" min={18} step={1} required value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} />
            <label htmlFor="editTc">TC</label>
            <input id="editTc" required inputMode="numeric" pattern="[0-9]{11}" maxLength={11} value={form.tc} onChange={e => setForm({ ...form, tc: e.target.value })} />
            <label htmlFor="editPhone">Telefon</label>
            <input id="editPhone" type="tel" required pattern="05[0-9]{9}" maxLength={11} value={form.telNo} onChange={e => setForm({ ...form, telNo: e.target.value })} />
            <div><button type="submit">{saving ? "Kaydediliyor..." : "Güncelle"}</button>
                <button type="button" onClick={() => router.push("/profile")}>İptal</button></div>
        </fieldset></form>
    </main>;
}

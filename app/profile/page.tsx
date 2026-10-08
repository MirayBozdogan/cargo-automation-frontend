"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

interface CurrentUser {
    id: number; name: string; surname: string; email: string;
    age: number; tc: string; telNo: string; role: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            router.replace("/");
            return;
        }
        let active = true;
        api.get<CurrentUser>("/users/me")
            .then(response => { if (active) setUser(response.data); })
            .catch(error => {
                if (active) setError(axios.isAxiosError<{ message: string }>(error)
                    ? error.response?.data?.message || "Profil yüklenemedi."
                    : "Beklenmeyen bir hata oluştu.");
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.replace("/");
    };

    return <main>
        <h1>Profilim</h1>
        {loading && <p role="status">Profil yükleniyor...</p>}
        {error && <p role="alert">{error}</p>}
        {user && <dl>
            <dt>Ad</dt><dd>{user.name}</dd>
            <dt>Soyad</dt><dd>{user.surname}</dd>
            <dt>E-posta</dt><dd>{user.email}</dd>
            <dt>Telefon</dt><dd>{user.telNo}</dd>
            <dt>Yaş</dt><dd>{user.age}</dd>
            <dt>TC kimlik numarası</dt><dd>{user.tc}</dd>
        </dl>}
        <button onClick={handleLogout}>Çıkış yap</button>
    </main>;
}

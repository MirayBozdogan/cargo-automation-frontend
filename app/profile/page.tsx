"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, error, logout, reload } = useAuth();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [loading, error, user, router]);
    return <main>
        <h1>Profilim</h1>
        {loading && <p role="status">Profil yükleniyor...</p>}
        {error && <div role="alert"><p>{error}</p><button onClick={reload}>Tekrar dene</button></div>}
        {user && <>
            <dl>
                <dt>Ad</dt><dd>{user.name}</dd><dt>Soyad</dt><dd>{user.surname}</dd>
                <dt>E-posta</dt><dd>{user.email}</dd><dt>Telefon</dt><dd>{user.telNo ?? "—"}</dd>
                <dt>Yaş</dt><dd>{user.age}</dd><dt>TC kimlik numarası</dt><dd>{user.tc ?? "—"}</dd>
                <dt>Rol</dt><dd>{user.role === "ADMIN" ? "Yönetici" : user.role === "STAFF" ? "Personel" : "Müşteri"}</dd>
            </dl>
            <p><Link href={`/users/${user.id}`}>Gönderilerim</Link></p>
            <p><Link href="/addresses">Adreslerim</Link></p>
            {user.role === "ADMIN" && <p><Link href="/staff">Personel Yönetimi</Link></p>}
            <button onClick={logout}>Çıkış yap</button>
        </>}
    </main>;
}

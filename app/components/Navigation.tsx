"use client";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function Navigation() {
    const { user, loading, error, logout, reload } = useAuth();
    if (loading) return <nav aria-label="Ana menü"><p role="status">Menü yükleniyor...</p></nav>;
    if (error) return <nav aria-label="Ana menü"><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button><Link href="/">Giriş Yap</Link></nav>;
    return <nav aria-label="Ana menü">
        {!user ? <><Link href="/">Giriş Yap</Link><Link href="/register">Kayıt Ol</Link></> : <>
            <Link href="/profile">Profilim</Link>
            <Link href="/addresses">Adreslerim</Link>
            <Link href={`/users/${user.id}`}>Gönderilerim</Link>
            <Link href="/shipments">Gönderi Oluştur</Link>
            {(user.role === "STAFF" || user.role === "ADMIN") && <Link href="/users">Müşteriler</Link>}
            {user.role === "ADMIN" && <Link href="/staff">Personel Yönetimi</Link>}
            <button onClick={logout}>Çıkış yap</button>
        </>}
    </nav>;
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Navigation() {
    const { user, loading, error, logout, reload } = useAuth();
    const pathname = usePathname();
    const links = user ? [
        { href: "/profile", label: "Profilim" },
        { href: "/addresses", label: "Adreslerim" },
        { href: `/users/${user.id}`, label: "Gönderilerim" },
        { href: "/shipments", label: "Gönderi Oluştur" },
        ...((user.role === "STAFF" || user.role === "ADMIN") ? [{ href: "/users", label: "Müşteriler" }] : []),
        ...((user.role === "STAFF" || user.role === "ADMIN") ? [{ href: "/operations", label: "Gönderi Operasyonları" }] : []),
        ...(user.role === "ADMIN" ? [{ href: "/staff", label: "Personel Yönetimi" }] : []),
    ] : [{ href: "/", label: "Giriş Yap" }, { href: "/register", label: "Kayıt Ol" }];

    return <nav className="site-nav" aria-label="Ana menü">
        <div className="nav-inner">
            <Link className="brand" href={user ? "/profile" : "/"} aria-label="Kargo Otomasyonu ana sayfa">
                <span className="brand-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                        <path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9M7.5 5.25l9 4.5v4.5" />
                    </svg>
                </span>
                <span>Kargo <strong>Otomasyonu</strong></span>
            </Link>
            {loading ? <p role="status" className="nav-status">Menü yükleniyor...</p>
                : error ? <div className="nav-links"><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button><Link href="/">Giriş Yap</Link></div>
                : <>
                    <div className="nav-links">{links.map(link => <Link key={link.href} href={link.href}
                        aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</div>
                    {user && <div className="nav-account">
                        <span className="role-badge">{user.role === "ADMIN" ? "Yönetici" : user.role === "STAFF" ? "Personel" : "Müşteri"}</span>
                        <button onClick={logout}>Çıkış yap</button>
                    </div>}
                </>}
        </div>
    </nav>;
}

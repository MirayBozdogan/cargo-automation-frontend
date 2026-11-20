"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
    BadgeIcon, BrandIcon, ChartIcon, ListIcon, LogoutIcon, MenuIcon, PackageIcon, PlusBoxIcon,
    SearchIcon, SenderIcon, TruckIcon, UsersIcon,
} from "./icons";
import styles from "./Navigation.module.css";

interface NavLink { href: string; label: string; icon: ReactNode }
const roleLabels = { ADMIN: "Yönetici", STAFF: "Personel", USER: "Müşteri" } as const;

function initials(name: string, surname: string) {
    return `${name.charAt(0)}${surname.charAt(0)}`.toLocaleUpperCase("tr-TR");
}

// Hangi bağlantıların görüneceği önceki sürümle aynıdır; yalnız yerleşim role göre değişir:
// müşteri üst menü, personel ve yönetici sol kenar menü kullanır.
export default function Navigation() {
    const { user, loading, error, logout, reload } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const isActive = (href: string) => pathname === href || (href === "/operations" && pathname.startsWith("/operations/"));
    const brand = <Link className={styles.brand} href={user ? "/profile" : "/"} aria-label="Kargo Otomasyonu ana sayfa">
        <span className={styles.brandIcon}><BrandIcon /></span>
        <span className={styles.brandText}>Kargo <span>Otomasyonu</span></span>
    </Link>;

    if (loading || error || !user) {
        return <header className={styles.topbar}>
            <nav className={styles.topInner} aria-label="Ana menü">
                {brand}
                {loading ? <p role="status" className={styles.status}>Menü yükleniyor...</p>
                    : error ? <div className={styles.topLinks}><p role="alert" className={styles.status}>{error}</p>
                        <button onClick={reload}>Tekrar dene</button><Link href="/">Giriş Yap</Link></div>
                        : <div className={styles.topLinks}>
                            {[{ href: "/", label: "Giriş Yap" }, { href: "/register", label: "Kayıt Ol" }].map(link =>
                                <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>{link.label}</Link>)}
                        </div>}
            </nav>
        </header>;
    }

    const account: NavLink[] = [
        { href: "/profile", label: "Profilim", icon: <SenderIcon /> },
        { href: `/users/${user.id}`, label: "Gönderilerim", icon: <PackageIcon /> },
        { href: "/shipments", label: "Gönderi Oluştur", icon: <PlusBoxIcon /> },
        { href: "/tracking", label: "Kargo Takibi", icon: <SearchIcon /> },
    ];
    const userChip = <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true">{initials(user.name, user.surname)}</span>
        <span className={styles.userText}>
            <span className={styles.userName}>{user.name} {user.surname}</span>
            <span className={styles.role}>{roleLabels[user.role]}</span>
        </span>
    </div>;
    const logoutButton = <button className={styles.logout} onClick={logout}><LogoutIcon /> Çıkış yap</button>;
    const renderLink = (link: NavLink) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
        aria-current={isActive(link.href) ? "page" : undefined}>{link.icon}<span>{link.label}</span></Link>;

    if (user.role === "USER") {
        return <header className={styles.topbar}>
            <nav className={styles.topInner} aria-label="Ana menü">
                {brand}
                <div className={`${styles.topLinks} ${styles.customerLinks}`}>{account.map(renderLink)}</div>
                <div className={styles.topAccount}>{userChip}{logoutButton}</div>
            </nav>
        </header>;
    }

    const groups: { title: string; links: NavLink[] }[] = [
        { title: "Operasyon", links: [
            { href: "/operations", label: "Gönderi Operasyonları", icon: <ListIcon /> },
            { href: "/deliveries", label: "Dağıtımdakiler", icon: <TruckIcon /> },
            { href: "/users", label: "Müşteriler", icon: <UsersIcon /> },
        ] },
        ...(user.role === "ADMIN" ? [{ title: "Yönetim", links: [
            { href: "/staff", label: "Personel Yönetimi", icon: <BadgeIcon /> },
            { href: "/reports", label: "Raporlar", icon: <ChartIcon /> },
        ] }] : []),
        { title: "Hesabım", links: account },
    ];
    return <header className={styles.sidebar}>
        <div className={styles.sidebarTop}>
            {brand}
            <button className={styles.menuButton} aria-expanded={open} aria-controls="sidebar-menu"
                onClick={() => setOpen(current => !current)}><MenuIcon /> Menü</button>
        </div>
        <nav id="sidebar-menu" className={`${styles.sidebarNav} ${open ? styles.open : ""}`} aria-label="Ana menü">
            {groups.map(group => <div key={group.title} className={styles.group}>
                <p className={styles.groupTitle}>{group.title}</p>
                {group.links.map(renderLink)}
            </div>)}
            <div className={styles.sidebarFooter}>{userChip}{logoutButton}</div>
        </nav>
    </header>;
}

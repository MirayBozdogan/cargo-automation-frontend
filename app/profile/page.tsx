"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { BadgeIcon, LockIcon, PackageIcon, PinIcon, SenderIcon } from "../components/icons";
import styles from "./page.module.css";

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, error, logout, reload } = useAuth();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [loading, error, user, router]);
    const roleLabel = user?.role === "ADMIN" ? "Yönetici" : user?.role === "STAFF" ? "Personel" : "Müşteri";
    return <main>
        <h1 className={user ? styles.srOnly : undefined}>Profilim</h1>
        {loading && <p role="status">Profil yükleniyor...</p>}
        {error && <div role="alert"><p>{error}</p><button onClick={reload}>Tekrar dene</button></div>}
        {user && <>
            <div className={styles.hero}>
                <span className={styles.avatar} aria-hidden="true">{`${user.name.charAt(0)}${user.surname.charAt(0)}`.toLocaleUpperCase("tr-TR")}</span>
                <div>
                    <p className="eyebrow">Profilim</p>
                    <p className={styles.name}>{user.name} {user.surname}</p>
                    <p className={styles.meta}>{user.email} · <span className={styles.role}>{roleLabel}</span></p>
                </div>
            </div>
            <div className={styles.layout}>
                <section className={styles.card} aria-labelledby="profile-details">
                    <h2 id="profile-details">Hesap bilgileri</h2>
                    <dl>
                        <dt>Ad</dt><dd>{user.name}</dd><dt>Soyad</dt><dd>{user.surname}</dd>
                        <dt>E-posta</dt><dd>{user.email}</dd><dt>Telefon</dt><dd>{user.telNo ?? "—"}</dd>
                        <dt>Yaş</dt><dd>{user.age}</dd><dt>TC kimlik numarası</dt><dd>{user.tc ?? "—"}</dd>
                        <dt>Rol</dt><dd>{roleLabel}</dd>
                    </dl>
                    <button onClick={logout}>Çıkış yap</button>
                </section>
                <nav className={styles.actions} aria-label="Hesap işlemleri">
                    <div className={styles.tile}><span className={styles.tileIcon} aria-hidden="true"><SenderIcon /></span>
                        <p><Link href={`/users/${user.id}/edit`}>Bilgilerimi düzenle</Link><span>Ad, e-posta ve telefon bilgilerini güncelle.</span></p></div>
                    <div className={styles.tile}><span className={styles.tileIcon} aria-hidden="true"><LockIcon /></span>
                        <p><Link href="/profile/password">Şifremi değiştir</Link><span>Mevcut şifrenle doğrulayıp yeni şifre belirle.</span></p></div>
                    <div className={styles.tile}><span className={styles.tileIcon} aria-hidden="true"><PackageIcon /></span>
                        <p><Link href={`/users/${user.id}`}>Gönderilerim</Link><span>Gönderdiğin ve sana gelen kargolar.</span></p></div>
                    <div className={styles.tile}><span className={styles.tileIcon} aria-hidden="true"><PinIcon /></span>
                        <p><Link href="/addresses">Adreslerim</Link><span>Kayıtlı adreslerini gör ve yenisini ekle.</span></p></div>
                    {user.role === "ADMIN" && <div className={styles.tile}><span className={styles.tileIcon} aria-hidden="true"><BadgeIcon /></span>
                        <p><Link href="/staff">Personel Yönetimi</Link><span>Personel ekle, düzenle veya pasif yap.</span></p></div>}
                </nav>
            </div>
        </>}
    </main>;
}

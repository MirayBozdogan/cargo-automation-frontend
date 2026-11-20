"use client";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import Navigation from "./Navigation";
import styles from "./AppShell.module.css";

// Personel ve yönetici için iki sütunlu (sol menü + içerik), diğerleri için tek sütunlu yerleşim.
export default function AppShell({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const operator = user?.role === "STAFF" || user?.role === "ADMIN";
    return <div className={operator ? styles.operator : styles.standard}>
        <a className={styles.skip} href="#icerik">İçeriğe geç</a>
        <Navigation />
        <div id="icerik" className={styles.content}>{children}</div>
    </div>;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { statusLabels, type ShipmentStatus } from "@/lib/shipment-display";
import { useAuth } from "../components/AuthProvider";
import { CheckCircleIcon, PackageIcon, TruckIcon } from "../components/icons";
import styles from "./page.module.css";

interface ShipmentReport {
    totalShipments: number;
    deliveredShipments: number;
    statusCounts: Record<keyof typeof statusLabels, number>;
}
const countFormat = new Intl.NumberFormat("tr-TR");
const percentFormat = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });
const barTone: Record<ShipmentStatus, string> = {
    CREATED: styles.created, ACCEPTED: styles.accepted, READY_FOR_DISTRIBUTION: styles.ready,
    OUT_FOR_DELIVERY: styles.out, DELIVERED: styles.delivered,
};

export default function ReportsPage() {
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [user, loading, error, router]);
    if (loading) return <main><p role="status">Yetkiler kontrol ediliyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (user.role !== "ADMIN") return <main><h1>Gönderi Raporu</h1><p role="alert">Bu sayfaya yalnız yöneticiler erişebilir.</p></main>;
    return <ShipmentReportView key={user.id} />;
}

function ShipmentReportView() {
    const [revision, setRevision] = useState(0);
    const [report, setReport] = useState<ShipmentReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        api.get<ShipmentReport>("/reports/shipments").then(response => {
            if (!active) return;
            setReport(response.data); setError(""); setLoading(false);
        }).catch(error => {
            if (!active) return;
            setReport(null);
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Rapor yüklenemedi."
                : "Rapor yüklenemedi.");
            setLoading(false);
        });
        return () => { active = false; };
    }, [revision]);
    function refresh() {
        setLoading(true); setError(""); setReport(null);
        setRevision(current => current + 1);
    }
    const share = (count: number) => report && report.totalShipments > 0 ? count / report.totalShipments : 0;
    return <main>
        <div className="page-head">
            <div>
                <p className="eyebrow">Yönetici</p>
                <h1>Gönderi Raporu</h1>
                <p>Silinmemiş gönderilerin toplamını ve güncel durumlara göre dağılımını görüntüle.</p>
            </div>
            <button disabled={loading} onClick={refresh}>Raporu yenile</button>
        </div>
        {loading ? <p role="status">Rapor yükleniyor...</p>
            : error ? <div role="alert" className="error-box"><p>{error}</p><button onClick={refresh}>Tekrar dene</button></div>
                : report && <>
                    {report.totalShipments === 0 && <p role="status">Henüz gönderi kaydı yok. Tüm sayılar sıfırdır.</p>}
                    <dl className={styles.totals} aria-label="Gönderi özeti">
                        <div><span className={styles.icon} aria-hidden="true"><PackageIcon /></span><dt>Toplam gönderi</dt><dd>{countFormat.format(report.totalShipments)}</dd></div>
                        <div><span className={`${styles.icon} ${styles.iconDelivered}`} aria-hidden="true"><CheckCircleIcon /></span><dt>Teslim edilen</dt><dd>{countFormat.format(report.deliveredShipments)}</dd></div>
                        <div><span className={`${styles.icon} ${styles.iconOut}`} aria-hidden="true"><TruckIcon /></span><dt>Dağıtımda</dt><dd>{countFormat.format(report.statusCounts.OUT_FOR_DELIVERY)}</dd></div>
                    </dl>
                    <section className={styles.distribution} aria-labelledby="status-distribution">
                        <h2 id="status-distribution">Durumlara göre gönderiler</h2>
                        <ul aria-label="Durum dağılımı">
                            {(Object.entries(statusLabels) as [ShipmentStatus, string][]).map(([status, label]) => <li key={status}>
                                <span className={styles.label}>{label}</span>
                                <span className={styles.track} aria-hidden="true"><span className={`${styles.bar} ${barTone[status]}`}
                                    style={{ width: `${Math.round(share(report.statusCounts[status]) * 100)}%` }} /></span>
                                <strong>{countFormat.format(report.statusCounts[status])}</strong>
                                <span className={styles.percent}>{percentFormat.format(share(report.statusCounts[status]))}</span>
                            </li>)}
                        </ul>
                    </section>
                    <p className={styles.note}>Sayılar rapor yüklendiği anı gösterir. Güncel veriler için raporu yenile.</p>
                </>}
    </main>;
}

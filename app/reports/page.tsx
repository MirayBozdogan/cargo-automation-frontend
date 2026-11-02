"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { statusLabels } from "@/lib/shipment-display";
import { useAuth } from "../components/AuthProvider";

interface ShipmentReport {
    totalShipments: number;
    deliveredShipments: number;
    statusCounts: Record<keyof typeof statusLabels, number>;
}
const countFormat = new Intl.NumberFormat("tr-TR");

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
    return <main>
        <p className="eyebrow">YÖNETİCİ</p>
        <h1>Gönderi Raporu</h1>
        <p>Silinmemiş gönderilerin toplamını ve güncel durumlara göre dağılımını görüntüle.</p>
        <button disabled={loading} onClick={refresh}>Raporu yenile</button>
        {loading ? <p role="status">Rapor yükleniyor...</p>
            : error ? <div role="alert" className="error-box"><p>{error}</p><button onClick={refresh}>Tekrar dene</button></div>
                : report && <>
                    {report.totalShipments === 0 && <p role="status">Henüz gönderi kaydı yok. Tüm sayılar sıfırdır.</p>}
                    <dl className="report-totals" aria-label="Gönderi özeti">
                        <div><dt>Toplam gönderi</dt><dd>{countFormat.format(report.totalShipments)}</dd></div>
                        <div><dt>Teslim edilen</dt><dd>{countFormat.format(report.deliveredShipments)}</dd></div>
                    </dl>
                    <h2>Durumlara göre gönderiler</h2>
                    <ul className="report-statuses" aria-label="Durum dağılımı">
                        {Object.entries(statusLabels).map(([status, label]) => <li key={status}>
                            <span>{label}</span>
                            <strong>{countFormat.format(report.statusCounts[status as keyof typeof statusLabels])}</strong>
                        </li>)}
                    </ul>
                    <p className="report-note">Sayılar rapor yüklendiği anı gösterir. Güncel veriler için raporu yenile.</p>
                </>}
    </main>;
}

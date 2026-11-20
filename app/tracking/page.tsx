"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "../components/AuthProvider";
import { dateFormat, statusLabels } from "@/lib/shipment-display";
import StatusBadge from "../components/StatusBadge";
import StatusTimeline from "../components/StatusTimeline";
import styles from "./page.module.css";

interface TrackingResult { barcode: string; status: keyof typeof statusLabels; createdAt: string | null; deliveredAt: string | null }
export default function TrackingPage() {
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [user, loading, error, router]);
    if (loading) return <main><p role="status">Oturum kontrol ediliyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    return <TrackingForm key={user.id} />;
}
function TrackingForm() {
    const [barcode, setBarcode] = useState("");
    const [result, setResult] = useState<TrackingResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const requestVersion = useRef(0);
    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true; requestVersion.current++;
        return () => { mounted.current = false; };
    }, []);
    async function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); if (busy) return;
        const value = barcode.trim().toUpperCase();
        if (!/^[A-Z0-9]{12}$/.test(value)) { setError("Barkod 12 harf veya rakamdan oluşmalıdır."); setResult(null); return; }
        const version = ++requestVersion.current;
        setBarcode(value); setBusy(true); setError(""); setResult(null);
        try {
            const response = await api.get<TrackingResult>(`/shipment/tracking/${encodeURIComponent(value)}`);
            if (mounted.current && requestVersion.current === version) setResult(response.data);
        } catch (error) {
            if (!mounted.current || requestVersion.current !== version) return;
            setError(axios.isAxiosError(error) && error.response?.status === 404
                ? "Bu barkoda ait erişebileceğin gönderi bulunamadı."
                : "Gönderi durumu alınamadı. Lütfen tekrar dene.");
        } finally {
            if (mounted.current && requestVersion.current === version) setBusy(false);
        }
    }
    return <main>
        <p className="eyebrow">Hesabım</p>
        <h1>Kargo Takibi</h1>
        <p>Gönderici veya alıcı olduğun gönderilerin güncel durumunu barkodla sorgulayabilirsin.</p>
        <form onSubmit={search} className={styles.search}>
            <fieldset disabled={busy}>
                <label htmlFor="trackingBarcode">Barkod</label>
                <div className={styles.searchRow}>
                    <input id="trackingBarcode" required minLength={12} maxLength={12} pattern="[A-Za-z0-9]{12}" autoComplete="off"
                        placeholder="12 karakterli barkod" value={barcode} onChange={event => { setBarcode(event.target.value); setResult(null); setError(""); }} />
                    <button type="submit">{busy ? "Sorgulanıyor..." : "Gönderiyi sorgula"}</button>
                </div>
            </fieldset>
        </form>
        {error && <p role="alert" className="error-box error-400">{error}</p>}
        {result && <section aria-labelledby="tracking-result" className={styles.result}>
            <div className={styles.resultHead}>
                <div>
                    <h2 id="tracking-result">Güncel gönderi durumu</h2>
                    <p className={`mono ${styles.barcode}`}>{result.barcode}</p>
                </div>
                <StatusBadge status={result.status} />
            </div>
            <StatusTimeline status={result.status} createdAt={result.createdAt} deliveredAt={result.deliveredAt} courierName={null} />
            <dl className={styles.facts}>
                <div><dt>Oluşturulma</dt><dd>{result.createdAt ? <time dateTime={result.createdAt}>{dateFormat.format(new Date(result.createdAt))}</time> : "—"}</dd></div>
                <div><dt>Teslim zamanı</dt><dd>{result.deliveredAt ? <time dateTime={result.deliveredAt}>{dateFormat.format(new Date(result.deliveredAt))}</time> : "—"}</dd></div>
            </dl>
            <p role="status" className={styles.srOnly}>{statusLabels[result.status] ?? "Bilinmeyen durum"}</p>
        </section>}
    </main>;
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "../components/AuthProvider";
import { dateFormat, statusLabels } from "@/lib/shipment-display";

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
        <h1>Kargo Takibi</h1>
        <p>Gönderici veya alıcı olduğun gönderilerin güncel durumunu barkodla sorgulayabilirsin.</p>
        <form onSubmit={search}>
            <fieldset disabled={busy} className="registration-fields">
                <label htmlFor="trackingBarcode">Barkod</label>
                <input id="trackingBarcode" required minLength={12} maxLength={12} pattern="[A-Za-z0-9]{12}" autoComplete="off"
                    placeholder="12 karakterli barkod" value={barcode} onChange={event => { setBarcode(event.target.value); setResult(null); setError(""); }} />
                <button type="submit">{busy ? "Sorgulanıyor..." : "Gönderiyi sorgula"}</button>
            </fieldset>
        </form>
        {error && <p role="alert" className="error-box error-400">{error}</p>}
        {result && <section aria-labelledby="tracking-result">
            <h2 id="tracking-result">Güncel gönderi durumu</h2>
            <dl>
                <dt>Barkod</dt><dd>{result.barcode}</dd>
                <dt>Durum</dt><dd>{statusLabels[result.status] ?? "Bilinmeyen durum"}</dd>
                <dt>Oluşturulma</dt><dd>{result.createdAt ? <time dateTime={result.createdAt}>{dateFormat.format(new Date(result.createdAt))}</time> : "—"}</dd>
                <dt>Teslim zamanı</dt><dd>{result.deliveredAt ? <time dateTime={result.deliveredAt}>{dateFormat.format(new Date(result.deliveredAt))}</time> : "—"}</dd>
            </dl>
            <p role="status">{statusLabels[result.status] ?? "Bilinmeyen durum"}</p>
        </section>}
    </main>;
}

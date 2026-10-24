"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { currency, dateFormat, fullName, statusLabels } from "@/lib/shipment-display";
import { useAuth } from "../../components/AuthProvider";

interface ShipmentDetail {
    id: number; barcode: string; status: keyof typeof statusLabels;
    width: number | null; length: number | null; height: number | null; weight: number | null; price: number | null;
    senderName: string | null; senderSurname: string | null; senderCity: string | null;
    senderDistrict: string | null; senderAddressText: string | null;
    receiverName: string | null; receiverSurname: string | null; receiverCity: string | null;
    receiverDistrict: string | null; receiverAddressText: string | null;
    createdAt: string | null; deliveredAt: string | null;
}
function location(city: string | null, district: string | null) {
    return [city, district].filter(Boolean).join(" / ") || "—";
}
function measurement(value: number | null, unit: string) {
    return value === null ? "—" : `${value} ${unit}`;
}
export default function OperationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [loading, error, user, router]);
    if (loading) return <main><p role="status">Yetkiler kontrol ediliyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (user.role !== "STAFF" && user.role !== "ADMIN") return <main><h1>Gönderi Detayı</h1><p role="alert">Bu sayfayı yalnız personel ve yöneticiler görebilir.</p></main>;
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) return <main><h1>Gönderi Detayı</h1><p role="alert">Geçersiz gönderi numarası.</p><Link href="/operations">Gönderi listesine dön</Link></main>;
    return <ShipmentDetailView key={`${user.id}:${id}`} id={id} />;
}
function ShipmentDetailView({ id }: { id: string }) {
    const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryable, setRetryable] = useState(false);
    const [revision, setRevision] = useState(0);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [actionBlocked, setActionBlocked] = useState(false);
    const inFlight = useRef(false);
    const mounted = useRef(false);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    useEffect(() => {
        let active = true;
        api.get<ShipmentDetail>(`/shipment/operations/${id}`).then(response => {
            if (!active) return;
            setShipment(response.data); setError(""); setActionBlocked(false); setLoading(false);
        }).catch(error => {
            if (!active) return;
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            setError(status === 404 ? "Gönderi bulunamadı veya silinmiş."
                : status === 403 ? "Bu gönderinin detayını görüntüleme yetkin yok."
                    : "Gönderi detayı yüklenemedi. Lütfen tekrar dene.");
            setRetryable(status !== 403 && status !== 404); setLoading(false);
        });
        return () => { active = false; };
    }, [id, revision]);
    function retry() {
        setLoading(true); setError(""); setRevision(current => current + 1);
    }
    async function performAction(action: "accept" | "prepare") {
        if (inFlight.current || !shipment || actionBlocked) return;
        inFlight.current = true;
        setActionBusy(true); setActionError(""); setActionSuccess("");
        try {
            const response = await api.patch<{ status: ShipmentDetail["status"] }>(`/shipment/${id}/${action}`);
            if (!mounted.current) return;
            setShipment(current => current ? { ...current, status: response.data.status } : current);
            setActionSuccess(action === "accept" ? "Gönderi kabul edildi." : "Gönderi dağıtıma hazırlandı.");
        } catch (error) {
            if (!mounted.current) return;
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            setActionError(status === 409 ? "Gönderinin durumu değişmiş olabilir. Güncel bilgiler yeniden yüklendi."
                : status === 403 ? "Bu işlemi yapma yetkin yok."
                    : "İşlem sonucu doğrulanamadı. Güncel gönderi durumu yeniden kontrol edildi.");
            if (status === 403) setActionBlocked(true);
            try {
                const latest = await api.get<ShipmentDetail>(`/shipment/operations/${id}`);
                if (mounted.current) setShipment(latest.data);
            } catch {
                if (mounted.current) {
                    setShipment(null); setError("Güncel gönderi bilgileri alınamadı. Tekrar yükleyerek kontrol et.");
                    setRetryable(true);
                }
            }
        } finally {
            inFlight.current = false;
            if (mounted.current) setActionBusy(false);
        }
    }
    return <main>
        <p><Link href="/operations">← Gönderi listesine dön</Link></p>
        <h1>Gönderi Detayı</h1>
        {loading ? <p role="status">Gönderi detayı yükleniyor...</p>
            : error ? <div role="alert" className="error-box error-500"><p>{error}</p>{retryable && <button onClick={retry}>Tekrar dene</button>}</div>
                : shipment && <>
                    <section aria-labelledby="shipment-overview">
                        <h2 id="shipment-overview">Gönderi bilgileri</h2>
                        <dl>
                            <dt>Barkod</dt><dd>{shipment.barcode}</dd>
                            <dt>Durum</dt><dd>{statusLabels[shipment.status] ?? "Bilinmeyen durum"}</dd>
                            <dt>Ücret</dt><dd>{shipment.price === null ? "—" : currency.format(shipment.price)}</dd>
                            <dt>Oluşturulma</dt><dd>{shipment.createdAt ? <time dateTime={shipment.createdAt}>{dateFormat.format(new Date(shipment.createdAt))}</time> : "—"}</dd>
                            <dt>Teslim zamanı</dt><dd>{shipment.deliveredAt ? <time dateTime={shipment.deliveredAt}>{dateFormat.format(new Date(shipment.deliveredAt))}</time> : "—"}</dd>
                        </dl>
                    </section>
                    <section aria-labelledby="shipment-actions">
                        <h2 id="shipment-actions">Gönderi işlemleri</h2>
                        {actionSuccess && <p role="status">{actionSuccess}</p>}
                        {actionError && <p role="alert" className="error-box error-400">{actionError}</p>}
                        {!actionBlocked && shipment.status === "CREATED" && <button className="button-primary" disabled={actionBusy}
                            onClick={() => performAction("accept")}>{actionBusy ? "İşleniyor..." : "Kabul et"}</button>}
                        {!actionBlocked && shipment.status === "ACCEPTED" && <button className="button-primary" disabled={actionBusy}
                            onClick={() => performAction("prepare")}>{actionBusy ? "İşleniyor..." : "Dağıtıma hazırla"}</button>}
                        {shipment.status !== "CREATED" && shipment.status !== "ACCEPTED" && <p>Bu durum için kabul veya hazırlama işlemi bulunmuyor.</p>}
                    </section>
                    <section aria-labelledby="sender-details">
                        <h2 id="sender-details">Gönderici ve çıkış adresi</h2>
                        <dl>
                            <dt>Ad soyad</dt><dd>{fullName(shipment.senderName, shipment.senderSurname)}</dd>
                            <dt>Şehir / ilçe</dt><dd>{location(shipment.senderCity, shipment.senderDistrict)}</dd>
                            <dt>Açık adres</dt><dd>{shipment.senderAddressText || "—"}</dd>
                        </dl>
                    </section>
                    <section aria-labelledby="receiver-details">
                        <h2 id="receiver-details">Alıcı ve teslimat adresi</h2>
                        <dl>
                            <dt>Ad soyad</dt><dd>{fullName(shipment.receiverName, shipment.receiverSurname)}</dd>
                            <dt>Şehir / ilçe</dt><dd>{location(shipment.receiverCity, shipment.receiverDistrict)}</dd>
                            <dt>Açık adres</dt><dd>{shipment.receiverAddressText || "—"}</dd>
                        </dl>
                    </section>
                    <section aria-labelledby="shipment-measurements">
                        <h2 id="shipment-measurements">Paket ölçüleri</h2>
                        <dl>
                            <dt>En</dt><dd>{measurement(shipment.width, "cm")}</dd>
                            <dt>Boy</dt><dd>{measurement(shipment.length, "cm")}</dd>
                            <dt>Yükseklik</dt><dd>{measurement(shipment.height, "cm")}</dd>
                            <dt>Ağırlık</dt><dd>{measurement(shipment.weight, "kg")}</dd>
                        </dl>
                    </section>
                </>}
    </main>;
}

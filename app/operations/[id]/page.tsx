"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { currency, dateFormat, fullName, type ShipmentStatus } from "@/lib/shipment-display";
import CourierAssignment from "../../components/CourierAssignment";
import { useAuth } from "../../components/AuthProvider";
import StatusBadge from "../../components/StatusBadge";
import StatusTimeline from "../../components/StatusTimeline";
import { ArrowLeftIcon, ClockIcon, PackageIcon, PinIcon, SenderIcon, TruckIcon } from "../../components/icons";
import styles from "./page.module.css";

interface ShipmentDetail {
    id: number; barcode: string; status: ShipmentStatus;
    width: number | null; length: number | null; height: number | null; weight: number | null; price: number | null;
    senderName: string | null; senderSurname: string | null; senderCity: string | null;
    senderDistrict: string | null; senderAddressText: string | null;
    receiverName: string | null; receiverSurname: string | null; receiverCity: string | null;
    receiverDistrict: string | null; receiverAddressText: string | null;
    createdAt: string | null; deliveredAt: string | null;
    courier: { id: number; name: string | null; surname: string | null } | null;
}
function location(city: string | null, district: string | null) {
    return [city, district].filter(Boolean).join(" / ") || "—";
}
function measurement(value: number | null, unit: string) {
    return value === null ? "—" : `${value} ${unit}`;
}
function formatTime(value: string | null) {
    return value ? <time dateTime={value}>{dateFormat.format(new Date(value))}</time> : "—";
}
// Panelde, sıradaki işlemi kısaca açıklar.
const nextStepText: Partial<Record<ShipmentStatus, string>> = {
    CREATED: "Gönderiyi kontrol et ve kabul et.",
    ACCEPTED: "Paket hazır olduğunda dağıtıma hazırla.",
    OUT_FOR_DELIVERY: "Gönderi kuryede. Alıcıya ulaştığında teslim kaydını oluştur.",
};
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
    return <ShipmentDetailView key={`${user.id}:${id}`} id={id} userId={user.id} role={user.role} />;
}
function ShipmentDetailView({ id, userId, role }: { id: string; userId: number; role: "STAFF" | "ADMIN" }) {
    const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryable, setRetryable] = useState(false);
    const [revision, setRevision] = useState(0);
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [actionBlocked, setActionBlocked] = useState(false);
    const [courierRevision, setCourierRevision] = useState(0);
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
    async function performAction(action: "accept" | "prepare" | "assign-courier" | "deliver", courierId?: number) {
        if (inFlight.current || !shipment || actionBlocked) return;
        inFlight.current = true;
        setActionBusy(true); setActionError(""); setActionSuccess("");
        try {
            const response = await api.patch<ShipmentDetail>(`/shipment/${id}/${action}`,
                action === "assign-courier" ? { courierId } : undefined);
            if (!mounted.current) return;
            setShipment(response.data);
            const messages = { accept: "Gönderi kabul edildi.", prepare: "Gönderi dağıtıma hazırlandı.",
                "assign-courier": "Kurye atandı; gönderi dağıtıma çıktı.", deliver: "Gönderi teslim edildi." };
            setActionSuccess(messages[action]);
        } catch (error) {
            if (!mounted.current) return;
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            const serverMessage = axios.isAxiosError<{ message: string }>(error) ? error.response?.data?.message : undefined;
            if (action === "assign-courier") setCourierRevision(current => current + 1);
            setActionError(status === 400 ? serverMessage || "Seçilen kurye uygun değil. Listeyi yeniden kontrol et."
                : status === 409 ? serverMessage || "Gönderinin durumu değişmiş olabilir. Güncel bilgiler yeniden kontrol ediliyor."
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
    const courierName = shipment?.courier ? fullName(shipment.courier.name, shipment.courier.surname) : null;
    return <main className={styles.page}>
        <Link className={styles.back} href="/operations"><ArrowLeftIcon /> Gönderi listesine dön</Link>
        {loading ? <section className={styles.card}><h1>Gönderi Detayı</h1><p role="status">Gönderi detayı yükleniyor...</p></section>
            : error ? <section className={styles.card}><h1>Gönderi Detayı</h1>
                <div role="alert" className="error-box error-500"><p>{error}</p>{retryable && <button onClick={retry}>Tekrar dene</button>}</div></section>
                : shipment && <>
                    <header className={`${styles.card} ${styles.header}`}>
                        <div className={styles.headerMain}>
                            <p className="eyebrow">Gönderi Detayı · #{shipment.id}</p>
                            <h1 className={styles.barcode}><span className={styles.srOnly}>Barkod </span>{shipment.barcode}</h1>
                            <div className={styles.meta}>
                                <StatusBadge status={shipment.status} />
                                <span><ClockIcon /> Oluşturulma {formatTime(shipment.createdAt)}</span>
                            </div>
                        </div>
                        <div className={styles.price}>
                            <span>Ücret</span>
                            <strong>{shipment.price === null ? "—" : currency.format(shipment.price)}</strong>
                        </div>
                    </header>

                    <section className={styles.card} aria-labelledby="shipment-progress">
                        <h2 id="shipment-progress" className={styles.cardTitle}>Gönderi süreci</h2>
                        <StatusTimeline status={shipment.status} createdAt={shipment.createdAt}
                            deliveredAt={shipment.deliveredAt} courierName={courierName} />
                    </section>

                    <div className={styles.layout}>
                        <aside className={`${styles.card} ${styles.panel}`} aria-labelledby="shipment-actions">
                            <h2 id="shipment-actions" className={styles.cardTitle}>Gönderi işlemleri</h2>
                            {actionSuccess && <p role="status" className={styles.success}>{actionSuccess}</p>}
                            {actionError && <p role="alert" className="error-box error-400">{actionError}</p>}
                            {!actionBlocked && nextStepText[shipment.status] && <p className={styles.hint}>{nextStepText[shipment.status]}</p>}
                            {!actionBlocked && shipment.status === "CREATED" && <button className="button-primary" disabled={actionBusy}
                                onClick={() => performAction("accept")}>{actionBusy ? "İşleniyor..." : "Kabul et"}</button>}
                            {!actionBlocked && shipment.status === "ACCEPTED" && <button className="button-primary" disabled={actionBusy}
                                onClick={() => performAction("prepare")}>{actionBusy ? "İşleniyor..." : "Dağıtıma hazırla"}</button>}
                            {!actionBlocked && shipment.status === "READY_FOR_DISTRIBUTION" && <CourierAssignment
                                key={courierRevision} busy={actionBusy} onAssign={courierId => performAction("assign-courier", courierId)} />}
                            {!actionBlocked && shipment.status === "OUT_FOR_DELIVERY" && (role === "ADMIN" || shipment.courier?.id === userId) &&
                                <button className="button-primary" disabled={actionBusy} onClick={() => performAction("deliver")}>
                                    {actionBusy ? "İşleniyor..." : "Teslim edildi olarak kaydet"}</button>}
                            {shipment.status === "OUT_FOR_DELIVERY" && role !== "ADMIN" && shipment.courier?.id !== userId &&
                                <p className={styles.hint}>Teslim kaydını yalnız atanan personel veya yönetici yapabilir.</p>}
                            {shipment.status === "DELIVERED" && <p className={styles.done}>Gönderi teslim edildi. İşlem tamamlandı.</p>}
                            <dl className={styles.facts}>
                                <div><dt><TruckIcon /> Kurye</dt><dd>{courierName ?? "Henüz atanmadı"}</dd></div>
                                <div><dt><ClockIcon /> Teslim zamanı</dt><dd>{formatTime(shipment.deliveredAt)}</dd></div>
                            </dl>
                            <Link className={styles.panelLink} href="/deliveries">Dağıtımdaki gönderileri görüntüle</Link>
                        </aside>

                        <div className={styles.mainColumn}>
                            <div className={styles.parties}>
                                <section className={styles.card} aria-labelledby="sender-details">
                                    <h2 id="sender-details" className={styles.cardTitle}><span className={styles.icon}><SenderIcon /></span>Gönderici</h2>
                                    <p className={styles.person}>{fullName(shipment.senderName, shipment.senderSurname)}</p>
                                    <p className={styles.place}>{location(shipment.senderCity, shipment.senderDistrict)}</p>
                                    <p className={styles.address}>{shipment.senderAddressText || "Açık adres girilmemiş"}</p>
                                </section>
                                <section className={styles.card} aria-labelledby="receiver-details">
                                    <h2 id="receiver-details" className={styles.cardTitle}><span className={styles.icon}><PinIcon /></span>Alıcı</h2>
                                    <p className={styles.person}>{fullName(shipment.receiverName, shipment.receiverSurname)}</p>
                                    <p className={styles.place}>{location(shipment.receiverCity, shipment.receiverDistrict)}</p>
                                    <p className={styles.address}>{shipment.receiverAddressText || "Açık adres girilmemiş"}</p>
                                </section>
                            </div>
                            <section className={styles.card} aria-labelledby="shipment-measurements">
                                <h2 id="shipment-measurements" className={styles.cardTitle}><span className={styles.icon}><PackageIcon /></span>Paket ölçüleri</h2>
                                <dl className={styles.stats}>
                                    <div><dt>En</dt><dd>{measurement(shipment.width, "cm")}</dd></div>
                                    <div><dt>Boy</dt><dd>{measurement(shipment.length, "cm")}</dd></div>
                                    <div><dt>Yükseklik</dt><dd>{measurement(shipment.height, "cm")}</dd></div>
                                    <div><dt>Ağırlık</dt><dd>{measurement(shipment.weight, "kg")}</dd></div>
                                </dl>
                            </section>
                        </div>
                    </div>
                </>}
    </main>;
}

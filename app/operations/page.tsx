"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";
import { statusLabels, currency, dateFormat, fullName } from "@/lib/shipment-display";
import { useAuth } from "../components/AuthProvider";

interface ShipmentSummary {
    id: number; barcode: string; status: keyof typeof statusLabels;
    senderName: string | null; senderSurname: string | null;
    receiverName: string | null; receiverSurname: string | null;
    price: number | null; createdAt: string | null;
}
interface ShipmentPage { content: ShipmentSummary[]; totalPages: number; totalElements: number; number: number }
interface ListRequest { status: string; page: number; revision: number }
export default function OperationsPage() {
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [user, loading, error, router]);
    if (loading) return <main><p role="status">Yetkiler kontrol ediliyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (user.role !== "STAFF" && user.role !== "ADMIN") return <main><h1>Gönderi Operasyonları</h1><p role="alert">Bu sayfayı yalnız personel ve yöneticiler görebilir.</p></main>;
    return <ShipmentList key={user.id} />;
}

function ShipmentList() {
    const [request, setRequest] = useState<ListRequest>({ status: "", page: 0, revision: 0 });
    const [result, setResult] = useState<ShipmentPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        api.get<ShipmentPage>("/shipment/operations", {
            params: { page: request.page, size: 10, ...(request.status ? { status: request.status } : {}) },
        }).then(response => {
            if (!active) return;
            if (request.page > 0 && request.page >= response.data.totalPages) {
                setRequest(current => ({ ...current, page: Math.max(0, response.data.totalPages - 1) }));
                return;
            }
            setResult(response.data); setError(""); setLoading(false);
        }).catch(error => {
            if (!active) return;
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Gönderiler yüklenemedi."
                : "Gönderiler yüklenemedi.");
            setLoading(false);
        });
        return () => { active = false; };
    }, [request]);
    function changeStatus(status: string) {
        setLoading(true); setError("");
        setRequest(current => ({ status, page: 0, revision: current.revision + 1 }));
    }
    function changePage(page: number) {
        if (loading) return;
        setLoading(true); setError("");
        setRequest(current => ({ ...current, page }));
    }
    function retry() {
        setLoading(true); setError("");
        setRequest(current => ({ ...current, revision: current.revision + 1 }));
    }
    return <main>
        <h1>Gönderi Operasyonları</h1>
        <p>Gönderileri görüntüle ve mevcut durumlarına göre filtrele. En yeni kayıtlar önce gösterilir.</p>
        <div className="registration-fields">
            <label htmlFor="shipmentStatus">Gönderi durumu</label>
            <select id="shipmentStatus" value={request.status} onChange={event => changeStatus(event.target.value)}>
                <option value="">Tüm durumlar</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
        </div>
        {loading ? <p role="status">Gönderiler yükleniyor...</p>
            : error ? <div role="alert" className="error-box error-500"><p>{error}</p><button onClick={retry}>Tekrar dene</button></div>
                : result && <>
                    <p role="status">Toplam {result.totalElements} gönderi</p>
                    {result.totalElements === 0 ? <p>{request.status ? "Bu durumda gönderi bulunamadı." : "Henüz gönderi kaydı yok."}</p> : <>
                        <div className="staff-table-container"><table>
                            <caption>{request.status ? statusLabels[request.status as keyof typeof statusLabels] : "Tüm durumlar"} — gönderi listesi</caption>
                            <thead><tr><th scope="col">Barkod</th><th scope="col">Gönderici</th><th scope="col">Alıcı</th><th scope="col">Durum</th><th scope="col">Ücret</th><th scope="col">Oluşturulma</th><th scope="col">İşlem</th></tr></thead>
                            <tbody>{result.content.map(shipment => <tr key={shipment.id}>
                                <td>{shipment.barcode}</td>
                                <td>{fullName(shipment.senderName, shipment.senderSurname)}</td>
                                <td>{fullName(shipment.receiverName, shipment.receiverSurname)}</td>
                                <td>{statusLabels[shipment.status] ?? "Bilinmeyen durum"}</td>
                                <td>{shipment.price === null ? "—" : currency.format(shipment.price)}</td>
                                <td>{shipment.createdAt ? <time dateTime={shipment.createdAt}>{dateFormat.format(new Date(shipment.createdAt))}</time> : "—"}</td>
                                <td><Link href={`/operations/${shipment.id}`} aria-label={`${shipment.barcode} gönderisinin detayını görüntüle`}>Detayı görüntüle</Link></td>
                            </tr>)}</tbody>
                        </table></div>
                        <button disabled={request.page === 0} onClick={() => changePage(request.page - 1)}>Önceki</button>
                        <span>Sayfa {result.number + 1} / {result.totalPages}</span>
                        <button disabled={request.page + 1 >= result.totalPages} onClick={() => changePage(request.page + 1)}>Sonraki</button>
                    </>}
                </>}
    </main>;
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth, type CurrentUser } from "../../components/AuthProvider";
import { statusLabels, dateFormat, currency } from "@/lib/shipment-display";

interface Address { id: number; neighborhood: string; buildingNo: number | null; apartmentNo: number | null; city: { name: string }; district: { name: string } }
interface Shipment {
    status: keyof typeof statusLabels; createdAt: string | null; deliveredAt: string | null;
    id: number; barcode: string; senderName: string; senderSurname: string;
    receiverName: string; receiverSurname: string; receiverCity: string; receiverDistrict: string;
    receiverAddressText: string; weight: number; price: number; sender: { id: number } | null;
}
interface ShipmentPage { content: Shipment[]; number: number; totalPages: number; totalElements: number }
function message(error: unknown, fallback: string) {
    return axios.isAxiosError<{ message: string }>(error) ? error.response?.data?.message || fallback : fallback;
}
export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [loading, error, user, router]);
    if (loading) return <main><p role="status">Kullanıcı bilgileri yükleniyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (String(user.id) !== id) return <main><p role="alert">Bu kullanıcının bilgilerine erişemezsiniz.</p></main>;
    return <UserDetailContent key={id} user={user} />;
}

function UserDetailContent({ user }: { user: CurrentUser }) {
    const id = String(user.id);
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(true);
    const [addressError, setAddressError] = useState("");
    const [addressRevision, setAddressRevision] = useState(0);
    const [result, setResult] = useState<ShipmentPage | null>(null);
    const [shipmentPage, setShipmentPage] = useState(0);
    const [shipmentError, setShipmentError] = useState("");
    const [shipmentsLoading, setShipmentsLoading] = useState(true);
    const [deleteError, setDeleteError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let active = true;
        api.get<Address[]>(`/users/${id}/address`).then(response => {
            if (active) { setAddresses(response.data); setAddressError(""); setAddressesLoading(false); }
        }).catch(error => {
            if (active) { setAddressError(message(error, "Adresler yüklenemedi.")); setAddressesLoading(false); }
        });
        return () => { active = false; };
    }, [id, addressRevision]);

    useEffect(() => {
        let active = true;
        api.get<ShipmentPage>("/shipment", { params: { page: shipmentPage, size: 5, sort: "id,desc" } })
            .then(response => {
                if (!active) return;
                const data = response.data;
                if (shipmentPage > 0 && shipmentPage >= data.totalPages) {
                    setShipmentPage(Math.max(0, data.totalPages - 1));
                    return;
                }
                setResult(data); setShipmentError(""); setShipmentsLoading(false);
            })
            .catch(error => {
                if (active) { setShipmentError(message(error, "Gönderiler yüklenemedi.")); setShipmentsLoading(false); }
            });
        return () => { active = false; };
    }, [id, shipmentPage, revision]);

    function changePage(page: number) {
        setShipmentsLoading(true); setShipmentError(""); setShipmentPage(page);
    }
    async function handleDeleteShipment(shipmentId: number) {
        if (deletingId !== null || !confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
        setDeletingId(shipmentId); setShipmentError(""); setDeleteError("");
        try {
            await api.delete(`/shipment/${shipmentId}`);
            setShipmentsLoading(true); setRevision(current => current + 1);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                setDeleteError(message(error, "Gönderinin durumu değişti; artık silinemiyor."));
                setShipmentsLoading(true); setRevision(current => current + 1);
            } else {
                setShipmentError(message(error, "Gönderi silinemedi."));
            }
        }
        finally { setDeletingId(null); }
    }
    return <main>
        <h1>Gönderilerim</h1>
        <p>ID: {user.id}</p><p>Ad: {user.name}</p><p>Soyad: {user.surname}</p>
        <p>E-posta: {user.email}</p><p>Telefon: {user.telNo ?? "—"}</p><p>Yaş: {user.age}</p><p>TC: {user.tc ?? "—"}</p>
        <button onClick={() => router.push("/shipments")}>+ Gönderi Oluştur</button>
        <h2>Adresler</h2>
        {addressesLoading ? <p role="status">Adresler yükleniyor...</p>
            : addressError ? <div role="alert"><p>{addressError}</p><button onClick={() => {
                setAddressesLoading(true); setAddressError(""); setAddressRevision(current => current + 1);
            }}>Adresleri tekrar yükle</button></div>
                : addresses.length === 0 ? <p>Bu kullanıcının kayıtlı adresi yok.</p> : <div className="staff-table-container"><table>
            <caption>Kayıtlı adreslerin</caption>
            <thead><tr><th>ID</th><th>Şehir</th><th>İlçe</th><th>Mahalle</th><th>Bina No</th><th>Daire No</th></tr></thead>
            <tbody>{addresses.map(address => <tr key={address.id}>
                <td>{address.id}</td><td>{address.city.name}</td><td>{address.district.name}</td>
                <td>{address.neighborhood}</td><td>{address.buildingNo ?? "—"}</td><td>{address.apartmentNo ?? "—"}</td>
            </tr>)}</tbody>
        </table></div>}
        <h2>Gönderi listesi</h2><p>Gönderici veya alıcı olduğun gönderiler burada listelenir.</p>
        <button disabled={shipmentsLoading || deletingId !== null} onClick={() => {
            setShipmentsLoading(true); setShipmentError(""); setRevision(current => current + 1);
        }}>Gönderileri yenile</button>
        {deleteError && <p role="alert" className="error-box error-400">{deleteError}</p>}
        {shipmentError && <div role="alert"><p>{shipmentError}</p><button disabled={shipmentsLoading} onClick={() => {
            setShipmentError(""); setShipmentsLoading(true); setRevision(current => current + 1);
        }}>Tekrar dene</button></div>}
        {shipmentsLoading ? <p role="status">Gönderiler yükleniyor...</p> : !shipmentError && result && <>
            {result.totalElements === 0 ? <p>Henüz gönderin yok.</p> : <>
                <p>Toplam {result.totalElements} gönderi</p>
                <div className="staff-table-container"><table className="customer-shipments-table"><thead><tr><th>ID</th><th>Barkod</th><th>Gönderici</th><th>Alıcı</th><th>Alıcı Adresi</th><th>Ağırlık</th><th>Fiyat</th><th>Durum</th><th>Oluşturulma</th><th>Teslim zamanı</th><th>İşlem</th></tr></thead>
                    <tbody>{result.content.map(shipment => <tr key={shipment.id}>
                        <td>{shipment.id}</td><td>{shipment.barcode}</td>
                        <td>{shipment.senderName} {shipment.senderSurname}</td><td>{shipment.receiverName} {shipment.receiverSurname}</td>
                        <td>{shipment.receiverCity} / {shipment.receiverDistrict}<br />{shipment.receiverAddressText}</td>
                        <td>{shipment.weight}</td><td>{currency.format(shipment.price)}</td>
                        <td>{statusLabels[shipment.status] ?? "Bilinmeyen durum"}</td>
                        <td>{shipment.createdAt ? <time dateTime={shipment.createdAt}>{dateFormat.format(new Date(shipment.createdAt))}</time> : "—"}</td>
                        <td>{shipment.deliveredAt ? <time dateTime={shipment.deliveredAt}>{dateFormat.format(new Date(shipment.deliveredAt))}</time> : "—"}</td>
                        <td>{shipment.sender?.id === user.id && (shipment.status === "CREATED" ? <button className="delete-shipment-button" disabled={deletingId !== null}
                            onClick={() => handleDeleteShipment(shipment.id)}>{deletingId === shipment.id ? "Siliniyor..." : "Sil"}</button> : "Kabul sonrası silinemez")}</td>
                    </tr>)}</tbody>
                </table></div>
                <button disabled={shipmentPage === 0 || deletingId !== null} onClick={() => changePage(shipmentPage - 1)}>Önceki</button>
                <span style={{ margin: "0 15px" }}>Sayfa {result.number + 1} / {result.totalPages}</span>
                <button disabled={shipmentPage + 1 >= result.totalPages || deletingId !== null} onClick={() => changePage(shipmentPage + 1)}>Sonraki</button>
            </>}
        </>}
    </main>;
}

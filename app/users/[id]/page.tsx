"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

interface User { id: number; name: string; surname: string; email: string; age: number; tc: string; telNo: string }
interface Address { id: number; neighborhood: string; buildingNo: number | null; apartmentNo: number | null; city: { name: string }; district: { name: string } }
interface Shipment {
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
    return <UserDetailContent key={id} id={id} />;
}

function UserDetailContent({ id }: { id: string }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [profileError, setProfileError] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);
    const [result, setResult] = useState<ShipmentPage | null>(null);
    const [shipmentPage, setShipmentPage] = useState(0);
    const [shipmentError, setShipmentError] = useState("");
    const [shipmentsLoading, setShipmentsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        if (!localStorage.getItem("token")) { router.replace("/"); return; }
        let active = true;
        async function load() {
            try {
                const response = await api.get<User>("/users/me");
                if (String(response.data.id) !== id) {
                    if (active) setProfileError("Bu kullanıcının bilgilerine erişemezsiniz.");
                    return;
                }
                const addressResponse = await api.get<Address[]>(`/users/${id}/address`);
                if (active) { setUser(response.data); setAddresses(addressResponse.data); }
            } catch (error) { if (active) setProfileError(message(error, "Kullanıcı bilgileri yüklenemedi.")); }
            finally { if (active) setProfileLoading(false); }
        }
        void load();
        return () => { active = false; };
    }, [id, router]);

    useEffect(() => {
        if (!user || String(user.id) !== id) return;
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
    }, [id, user, shipmentPage, revision]);

    function changePage(page: number) {
        setShipmentsLoading(true); setShipmentError(""); setShipmentPage(page);
    }
    async function handleDeleteShipment(shipmentId: number) {
        if (deletingId !== null || !confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
        setDeletingId(shipmentId); setShipmentError("");
        try {
            await api.delete(`/shipment/${shipmentId}`);
            setShipmentsLoading(true); setRevision(current => current + 1);
        } catch (error) { setShipmentError(message(error, "Gönderi silinemedi.")); }
        finally { setDeletingId(null); }
    }
    if (profileLoading) return <main><p role="status">Kullanıcı bilgileri yükleniyor...</p></main>;
    if (profileError || !user || String(user.id) !== id) return <main><p role="alert">{profileError || "Kullanıcı bilgileri gösterilemiyor."}</p></main>;
    return <main>
        <h1>Kullanıcı Detayı</h1>
        <p>ID: {user.id}</p><p>Ad: {user.name}</p><p>Soyad: {user.surname}</p>
        <p>Email: {user.email}</p><p>Telefon: {user.telNo}</p><p>Yaş: {user.age}</p><p>TC: {user.tc}</p>
        <button onClick={() => router.push("/shipments")}>+ Gönderi Oluştur</button>
        <h2>Adresler</h2>
        {addresses.length === 0 ? <p>Bu kullanıcının kayıtlı adresi yok.</p> : <table>
            <thead><tr><th>ID</th><th>Şehir</th><th>İlçe</th><th>Mahalle</th><th>Bina No</th><th>Daire No</th></tr></thead>
            <tbody>{addresses.map(address => <tr key={address.id}>
                <td>{address.id}</td><td>{address.city.name}</td><td>{address.district.name}</td>
                <td>{address.neighborhood}</td><td>{address.buildingNo ?? "—"}</td><td>{address.apartmentNo ?? "—"}</td>
            </tr>)}</tbody>
        </table>}
        <h2>Gönderilerim</h2><p>Gönderici veya alıcı olduğun gönderiler burada listelenir.</p>
        {shipmentError && <div role="alert"><p>{shipmentError}</p><button disabled={shipmentsLoading} onClick={() => {
            setShipmentError(""); setShipmentsLoading(true); setRevision(current => current + 1);
        }}>Tekrar dene</button></div>}
        {shipmentsLoading ? <p role="status">Gönderiler yükleniyor...</p> : !shipmentError && result && <>
            {result.totalElements === 0 ? <p>Henüz gönderin yok.</p> : <>
                <p>Toplam {result.totalElements} gönderi</p>
                <table><thead><tr><th>ID</th><th>Barkod</th><th>Gönderici</th><th>Alıcı</th><th>Alıcı Adresi</th><th>Ağırlık</th><th>Fiyat</th><th>İşlem</th></tr></thead>
                    <tbody>{result.content.map(shipment => <tr key={shipment.id}>
                        <td>{shipment.id}</td><td>{shipment.barcode}</td>
                        <td>{shipment.senderName} {shipment.senderSurname}</td><td>{shipment.receiverName} {shipment.receiverSurname}</td>
                        <td>{shipment.receiverCity} / {shipment.receiverDistrict}<br />{shipment.receiverAddressText}</td>
                        <td>{shipment.weight}</td><td>{shipment.price}</td>
                        <td>{shipment.sender?.id === user.id && <button className="delete-shipment-button" disabled={deletingId !== null}
                            onClick={() => handleDeleteShipment(shipment.id)}>{deletingId === shipment.id ? "Siliniyor..." : "Sil"}</button>}</td>
                    </tr>)}</tbody>
                </table>
                <button disabled={shipmentPage === 0 || deletingId !== null} onClick={() => changePage(shipmentPage - 1)}>Önceki</button>
                <span style={{ margin: "0 15px" }}>Sayfa {result.number + 1} / {result.totalPages}</span>
                <button disabled={shipmentPage + 1 >= result.totalPages || deletingId !== null} onClick={() => changePage(shipmentPage + 1)}>Sonraki</button>
            </>}
        </>}
    </main>;
}

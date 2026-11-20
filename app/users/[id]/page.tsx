"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { useAuth, type CurrentUser } from "../../components/AuthProvider";
import { statusLabels, dateFormat, currency } from "@/lib/shipment-display";
import StatusBadge from "../../components/StatusBadge";
import { PinIcon, PlusBoxIcon } from "../../components/icons";
import styles from "./page.module.css";

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
        <div className="page-head">
            <div>
                <p className="eyebrow">Hesabım</p>
                <h1>Gönderilerim</h1>
                <p>Gönderici veya alıcı olduğun gönderiler burada listelenir.</p>
            </div>
            <button className="button-primary" onClick={() => router.push("/shipments")}><PlusBoxIcon /> Gönderi Oluştur</button>
        </div>
        <dl className={styles.info} aria-label="Hesap bilgileri">
            <div><dt>Ad soyad</dt><dd>{user.name} {user.surname}</dd></div>
            <div><dt>E-posta</dt><dd>{user.email}</dd></div>
            <div><dt>Telefon</dt><dd>{user.telNo ?? "—"}</dd></div>
            <div><dt>Müşteri no</dt><dd>{user.id}</dd></div>
        </dl>

        <div className={styles.sectionHead}>
            <h2>Gönderi listesi</h2>
            <button disabled={shipmentsLoading || deletingId !== null} onClick={() => {
                setShipmentsLoading(true); setShipmentError(""); setRevision(current => current + 1);
            }}>Gönderileri yenile</button>
        </div>
        {deleteError && <p role="alert" className="error-box error-400">{deleteError}</p>}
        {shipmentError && <div role="alert" className="error-box error-500"><p>{shipmentError}</p><button disabled={shipmentsLoading} onClick={() => {
            setShipmentError(""); setShipmentsLoading(true); setRevision(current => current + 1);
        }}>Tekrar dene</button></div>}
        {shipmentsLoading ? <p role="status">Gönderiler yükleniyor...</p> : !shipmentError && result && <>
            {result.totalElements === 0 ? <p className={styles.empty}>Henüz gönderin yok. İlk gönderini oluşturmak için <b>Gönderi Oluştur</b>&apos;a tıkla.</p> : <>
                <p className="count">Toplam <strong>{result.totalElements}</strong> gönderi</p>
                <div className="staff-table-container"><table className="customer-shipments-table"><thead><tr><th>Barkod</th><th>Gönderici</th><th>Alıcı</th><th>Alıcı adresi</th><th>Ağırlık</th><th>Fiyat</th><th>Durum</th><th>Oluşturulma</th><th>Teslim zamanı</th><th>İşlem</th></tr></thead>
                    <tbody>{result.content.map(shipment => <tr key={shipment.id}>
                        <td className="mono">{shipment.barcode}</td>
                        <td>{shipment.senderName} {shipment.senderSurname}</td><td>{shipment.receiverName} {shipment.receiverSurname}</td>
                        <td><span className={styles.city}>{shipment.receiverCity} / {shipment.receiverDistrict}</span><br /><span className="muted">{shipment.receiverAddressText}</span></td>
                        <td>{shipment.weight} kg</td><td>{currency.format(shipment.price)}</td>
                        <td><StatusBadge status={shipment.status} /></td>
                        <td className="muted">{shipment.createdAt ? <time dateTime={shipment.createdAt}>{dateFormat.format(new Date(shipment.createdAt))}</time> : "—"}</td>
                        <td className="muted">{shipment.deliveredAt ? <time dateTime={shipment.deliveredAt}>{dateFormat.format(new Date(shipment.deliveredAt))}</time> : "—"}</td>
                        <td>{shipment.sender?.id === user.id && (shipment.status === "CREATED" ? <button className={styles.delete} disabled={deletingId !== null}
                            onClick={() => handleDeleteShipment(shipment.id)}>{deletingId === shipment.id ? "Siliniyor..." : "Sil"}</button> : <span className="muted">Kabul sonrası silinemez</span>)}</td>
                    </tr>)}</tbody>
                </table></div>
                <div className="pager">
                    <button disabled={shipmentPage === 0 || deletingId !== null} onClick={() => changePage(shipmentPage - 1)}>Önceki</button>
                    <span>Sayfa {result.number + 1} / {result.totalPages}</span>
                    <button disabled={shipmentPage + 1 >= result.totalPages || deletingId !== null} onClick={() => changePage(shipmentPage + 1)}>Sonraki</button>
                </div>
            </>}
        </>}

        <h2>Adresler</h2>
        {addressesLoading ? <p role="status">Adresler yükleniyor...</p>
            : addressError ? <div role="alert" className="error-box error-500"><p>{addressError}</p><button onClick={() => {
                setAddressesLoading(true); setAddressError(""); setAddressRevision(current => current + 1);
            }}>Adresleri tekrar yükle</button></div>
                : addresses.length === 0 ? <p className={styles.empty}>Bu kullanıcının kayıtlı adresi yok.</p>
                    : <ul className={styles.addresses} aria-label="Kayıtlı adreslerin">{addresses.map(address => <li key={address.id}>
                        <span className={styles.addressIcon} aria-hidden="true"><PinIcon /></span>
                        <span><strong>{address.city.name} / {address.district.name}</strong><br />
                            <span className="muted">{address.neighborhood}{address.buildingNo !== null && `, Bina No: ${address.buildingNo}`}{address.apartmentNo !== null && `, Daire No: ${address.apartmentNo}`}</span></span>
                    </li>)}</ul>}
    </main>;
}

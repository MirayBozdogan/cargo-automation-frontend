"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

interface Customer {
    id: number;
    name: string;
    surname: string;
    email: string;
    age: number;
    tc: string;
    telNo: string;
}

interface Address {
    id: number;
    neighborhood: string;
    buildingNo: number;
    apartmentNo: number;
    city: {
        name: string;
    };
    district: {
        name: string;
    };
}

interface Shipment {
    id: number;
    barcode: string;
    senderName: string;
    senderSurname: string;
    receiverName: string;
    receiverSurname: string;
    receiverCity: string;
    receiverDistrict: string;
    receiverAddressText: string;
    weight: number;
    price: number;
}

export default function CustomerDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);

    const [shipmentPage, setShipmentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        api.get<Customer>(`/customers/${id}`)
            .then(res => setCustomer(res.data))
            .catch(err => console.error("Müşteri alınamadı:", err));

        api.get<Address[]>(`/customers/${id}/address`)
            .then(res => setAddresses(res.data))
            .catch(err => console.error("Adresler alınamadı:", err));
    }, [id]);

    useEffect(() => {
        api.get(
            `/shipment/customer/${id}?page=${shipmentPage}&size=5`
        )
            .then(res => {
                setShipments(res.data.content);
                setTotalPages(res.data.totalPages);
            })
            .catch(err =>
                console.error("Gönderiler alınamadı:", err)
            );
    }, [id, shipmentPage]);


    const handleDeleteShipment = async (shipmentId: number) => {
        if (!confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) {
            return;
        }

        try {
            await api.delete(`/shipment/${shipmentId}`);

            setShipments(prev =>
                prev.filter(shipment => shipment.id !== shipmentId)
            );

        } catch (error) {
            console.error("Gönderi silinemedi:", error);
        }
    };

    if (!customer) {
        return <p>Yükleniyor...</p>;
    }

    return (
        <main>
            <h1>Müşteri Detayı</h1>

            <p>ID: {customer.id}</p>
            <p>Ad: {customer.name}</p>
            <p>Soyad: {customer.surname}</p>
            <p>Email: {customer.email}</p>
            <p>Telefon: {customer.telNo}</p>
            <p>Yaş: {customer.age}</p>
            <p>TC: {customer.tc}</p>

            <hr />

            <button
                onClick={() =>
                    router.push(`/customers/${customer.id}/shipment`)
                }
            >
                + Gönderi Oluştur
            </button>

            <hr />

            <h2>Adresler</h2>

            {addresses.length === 0 ? (
                <p>Bu müşterinin kayıtlı adresi yok.</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Şehir</th>
                        <th>İlçe</th>
                        <th>Mahalle</th>
                        <th>Bina No</th>
                        <th>Daire No</th>
                    </tr>
                    </thead>

                    <tbody>
                    {addresses.map(address => (
                        <tr key={address.id}>
                            <td>{address.id}</td>
                            <td>{address.city.name}</td>
                            <td>{address.district.name}</td>
                            <td>{address.neighborhood}</td>
                            <td>{address.buildingNo}</td>
                            <td>{address.apartmentNo}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <hr />

            <h2>Gönderiler</h2>

            {shipments.length === 0 ? (
                <p>Bu müşteriye ait gönderi yok.</p>
            ) : (
                <>
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Barkod</th>
                            <th>Gönderici</th>
                            <th>Alıcı</th>
                            <th>Alıcı Adresi</th>
                            <th>Ağırlık</th>
                            <th>Fiyat</th>
                        </tr>
                        </thead>

                        <tbody>
                        {shipments.map(shipment => (
                            <tr key={shipment.id}>
                                <td>{shipment.id}</td>

                                <td>{shipment.barcode}</td>

                                <td>
                                    {shipment.senderName}{" "}
                                    {shipment.senderSurname}
                                </td>

                                <td>
                                    {shipment.receiverName}{" "}
                                    {shipment.receiverSurname}
                                </td>

                                <td>
                                    {shipment.receiverCity} /{" "}
                                    {shipment.receiverDistrict}
                                    <br />
                                    {shipment.receiverAddressText}
                                </td>

                                <td>{shipment.weight}</td>

                                <td>{shipment.price}</td>

                                <td>
                                    <button  className="delete-shipment-button"
                                             onClick={() => handleDeleteShipment(shipment.id)}>
                                      Sil
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <br />

                    <button
                        disabled={shipmentPage === 0}
                        onClick={() => setShipmentPage(shipmentPage - 1)}
                    >
                        Önceki
                    </button>

                    <span style={{ margin: "0 15px" }}>
                        Sayfa {shipmentPage + 1} / {totalPages}
                    </span>

                    <button
                        disabled={shipmentPage + 1 >= totalPages}
                        onClick={() => setShipmentPage(shipmentPage + 1)}
                    >
                        Sonraki
                    </button>
                </>
            )}
        </main>
    );
}
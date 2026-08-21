"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Shipment {
    id: number;
    barcode: string;

    senderName: string;
    senderSurname: string;
    senderCity: string;
    senderDistrict: string;
    senderAddressText: string;

    receiverName: string;
    receiverSurname: string;
    receiverCity: string;
    receiverDistrict: string;
    receiverAddressText: string;

    weight: number;
    price: number;
}

interface ShipmentPage {
    content: Shipment[];
    totalPages: number;
    totalElements: number;
    number: number;
}

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [barcode, setBarcode] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await api.get<Shipment>(
                `/shipment/barcode/${barcode}`
            );

            setShipments([response.data]);
            setTotalPages(1);
            setPage(0);

        } catch (error) {
            console.error("Gönderi bulunamadı:", error);
            setShipments([]);
        }
    };

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

    useEffect(() => {
        api
            .get<ShipmentPage>(`/shipment?page=${page}&size=5`)
            .then((response) => {
                setShipments(response.data.content);
                setTotalPages(response.data.totalPages);
            })
            .catch((error) => {
                console.error("Gönderiler alınamadı:", error);
            });
    }, [page]);


    return (
        <main>
            <h1>Gönderiler</h1>

            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Barkod numarası"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    //Kullanıcı input'a her yazdığında onChange çalışır.
                />

                <button type="submit">
                    Ara
                </button>
            </form>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Barkod</th>

                    <th>Gönderici</th>
                    <th>Gönderici Adresi</th>

                    <th>Alıcı</th>
                    <th>Alıcı Adresi</th>

                    <th>Ağırlık</th>
                    <th>Fiyat</th>
                </tr>
                </thead>

                <tbody>
                {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                        <td>{shipment.id}</td>

                        <td>{shipment.barcode}</td>

                        <td>
                            {shipment.senderName} {shipment.senderSurname}
                        </td>

                        <td>
                            {shipment.senderCity} / {shipment.senderDistrict}
                            <br />
                            {shipment.senderAddressText}
                        </td>

                        <td>
                            {shipment.receiverName} {shipment.receiverSurname}
                        </td>

                        <td>
                            {shipment.receiverCity} / {shipment.receiverDistrict}
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

            <div>
                <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                >
                    Önceki
                </button>

                <span>
                    Sayfa {page + 1} / {totalPages}
                </span>

                <button
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Sonraki
                </button>
            </div>
        </main>
    );
}
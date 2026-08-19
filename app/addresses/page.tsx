"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface City {
    id: number;
    name: string;
}

interface District {
    id: number;
    name: string;
}

interface Address {
    id: number;
    neighborhood: string;
    buildingNo: number;
    apartmentNo: number;
    city: City;
    district: District;
}

interface AddressPage {
    content: Address[];
    totalPages: number;
    totalElements: number;
    number: number;
}

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        api
            .get<AddressPage>(`/customers/address?page=${page}&size=5`)
            .then((response) => {
                setAddresses(response.data.content);
                setTotalPages(response.data.totalPages);
            })
            .catch((error) => {
                console.error("Adresler alınamadı:", error);
            });
    }, [page]);

    return (
        <main>
            <h1>Adresler</h1>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>İl</th>
                    <th>İlçe</th>
                    <th>Mahalle</th>
                    <th>Bina No</th>
                    <th>Daire No</th>
                </tr>
                </thead>

                <tbody>
                {addresses.map((address) => (
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
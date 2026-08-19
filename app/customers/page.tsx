"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
interface CustomerPage {
    content: Customer[];
    totalPages: number;
    totalElements: number;
    number: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        api
            .get<CustomerPage>(`/customers?page=${page}&size=5`)
            .then((response) => {
                setCustomers(response.data.content);
                setTotalPages(response.data.totalPages);
            })
            .catch((error) => {
                console.error("Müşteriler alınamadı:", error);
            });
    }, [page]);

    return (
        <main>
            <h1>Müşteriler</h1>

            <Link href="/customers/new">
                <button>Yeni Müşteri</button>
            </Link>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Ad</th>
                    <th>Soyad</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Yaş</th>
                </tr>
                </thead>

                <tbody>
                {customers.map((customer) => (
                    <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.surname}</td>
                        <td>{customer.email}</td>
                        <td>{customer.telNo}</td>
                        <td>{customer.age}</td>
                        <td>
                            <a href={`/customers/${customer.id}`}>
                                Detay
                            </a>
                        </td>
                        <td>
                            <a href={`/customers/${customer.id}/edit`}>
                                Düzenle
                            </a>
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
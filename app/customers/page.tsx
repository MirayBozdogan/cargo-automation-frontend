"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import axios from "axios";

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

    const [customerToDelete, setCustomerToDelete] =
        useState<Customer | null>(null);

    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

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

    const deleteCustomer = async () => {
        if (!customerToDelete) {
            return;
        }

        setIsDeleting(true);
        setDeleteError("");

        try {
            await api.delete(`/customers/${customerToDelete.id}`);

            setCustomers((prevCustomers) =>
                prevCustomers.filter(
                    (customer) => customer.id !== customerToDelete.id
                )
            );

            setCustomerToDelete(null);
        } catch (error: unknown) {
            console.error("Müşteri silinemedi:", error);

            if (axios.isAxiosError(error)) {
                setDeleteError(
                    error.response?.data?.message ||
                    "Müşteri silinirken bir hata oluştu."
                );
            } else {
                setDeleteError("Müşteri silinirken bir hata oluştu.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

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
                    <th>Detay</th>
                    <th>Düzenle</th>
                    <th>Sil</th>
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

                        <td>
                            <button
                                onClick={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteError("");
                                }}
                            >
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

            {customerToDelete && (
                <div className="modalOverlay">
                    <div className="modal">
                        <h2>Müşteriyi Sil</h2>

                        <p>
                            <strong>
                                {customerToDelete.name}{" "}
                                {customerToDelete.surname}
                            </strong>{" "}
                            adlı müşteriyi silmek istediğinize emin misiniz?
                        </p>

                        {deleteError && (
                            <p className="deleteError">
                                {deleteError}
                            </p>
                        )}

                        <div className="modalButtons">
                            <button
                                onClick={() => {
                                    setCustomerToDelete(null);
                                    setDeleteError("");
                                }}
                                disabled={isDeleting}
                            >
                                Vazgeç
                            </button>

                            <button
                                onClick={deleteCustomer}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Siliniyor..." : "Sil"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
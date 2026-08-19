"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function CustomerDetailPage() {
    const params = useParams();
    const id = params.id;

    const [customer, setCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        api
            .get<Customer>(`/customers/${id}`)
            .then((response) => {
                setCustomer(response.data);
            })
            .catch((error) => {
                console.error("Müşteri alınamadı:", error);
            });
    }, [id]);

    if (!customer) {
        return <p>Yükleniyor...</p>;
    }

    return (
        <div>
            <h1>Müşteri Detayı</h1>

            <p>ID: {customer.id}</p>
            <p>Ad: {customer.name}</p>
            <p>Soyad: {customer.surname}</p>
            <p>Email: {customer.email}</p>
            <p>Telefon: {customer.telNo}</p>
            <p>Yaş: {customer.age}</p>
            <p>TC: {customer.tc}</p>
        </div>
    );
}
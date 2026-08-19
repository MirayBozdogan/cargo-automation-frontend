"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

interface CustomerRequest {
    name: string;
    surname: string;
    email: string;
    age: number;
    tc: string;
    telNo: string;
}

export default function EditCustomerPage() {
    const params = useParams();
    const router = useRouter();

    const customerId = params.id as string;

    const [form, setForm] = useState<CustomerRequest>({
        name: "",
        surname: "",
        email: "",
        age: 18,
        tc: "",
        telNo: "",
    });

    const [error, setError] = useState("");
    const [errorStatus, setErrorStatus] =
        useState<number | null>(null);

    const [loading, setLoading] = useState(true);

    // Müşteriyi getir
    useEffect(() => {
        api.get<CustomerRequest>(
            `/customers/${customerId}`
        )
            .then((response) => {
                setForm(response.data);
            })
            .catch((error) => {
                console.error(
                    "Müşteri alınamadı:",
                    error
                );

                if (axios.isAxiosError(error)) {
                    setErrorStatus(
                        error.response?.status ?? null
                    );

                    setError(
                        error.response?.data?.message ||
                        "Müşteri alınamadı."
                    );
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [customerId]);

    // Input değişiklikleri
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]:
                name === "age"
                    ? Number(value)
                    : value,
        });
    };

    // Güncelle
    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        setError("");
        setErrorStatus(null);

        try {
            await api.put(
                `/customers/${customerId}`,
                form
            );

            router.push("/customers");

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setErrorStatus(
                    error.response?.status ?? null
                );

                setError(
                    error.response?.data?.message ||
                    "Müşteri güncellenemedi."
                );

                console.error(
                    "Güncelleme hatası:",
                    error.response?.status,
                    error.response?.data
                );
            } else {
                setError(
                    "Beklenmeyen bir hata oluştu."
                );
            }
        }
    };

    if (loading) {
        return <p>Müşteri bilgileri yükleniyor...</p>;
    }

    return (
        <main>
            <h1>Müşteri Düzenle</h1>

            {error && (
                <div
                    className={
                        errorStatus === 400
                            ? "error-box error-400"
                            : errorStatus === 500
                                ? "error-box error-500"
                                : "error-box"
                    }
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                <input
                    name="name"
                    type="text"
                    placeholder="Ad"
                    value={form.name}
                    onChange={handleChange}
                    required
                    pattern="[A-Za-zÇĞİÖŞÜçğıöşü\s]+"
                    title="Ad sadece harflerden oluşmalıdır."
                />

                <input
                    name="surname"
                    type="text"
                    placeholder="Soyad"
                    value={form.surname}
                    onChange={handleChange}
                    required
                    pattern="[A-Za-zÇĞİÖŞÜçğıöşü\s]+"
                    title="Soyad sadece harflerden oluşmalıdır."
                />

                <input
                    name="email"
                    type="email"
                    placeholder="E-posta"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    name="age"
                    type="number"
                    placeholder="Yaş"
                    value={form.age}
                    onChange={handleChange}
                    required
                    min={18}
                />

                <input
                    name="tc"
                    type="text"
                    placeholder="TC"
                    value={form.tc}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{11}"
                    maxLength={11}
                    title="TC 11 haneli olmalıdır."
                />

                <input
                    name="telNo"
                    type="text"
                    placeholder="Telefon"
                    value={form.telNo}
                    onChange={handleChange}
                    required
                    pattern="05[0-9]{9}"
                    maxLength={11}
                    title="Telefon 05 ile başlamalı ve 11 haneli olmalıdır."
                />

                <button type="submit">
                    Güncelle
                </button>

                <button
                    type="button"
                    onClick={() =>
                        router.push("/customers")
                    }
                >
                    İptal
                </button>

            </form>
        </main>
    );
}
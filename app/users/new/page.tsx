"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

interface UserRequest {
    name: string;
    surname: string;
    email: string;
    age: number;
    tc: string;
    telNo: string;
}

interface City {
    id: number;
    name: string;
}

interface District {
    id: number;
    name: string;
}

interface AddressRequest {
    neighborhood: string;
    buildingNo: string;
    apartmentNo: string;
    cityId: number;
    districtId: number;
}

export default function NewUserPage() {
    const router = useRouter();

    const [form, setForm] = useState<UserRequest>({
        name: "",
        surname: "",
        email: "",
        age: 18,
        tc: "",
        telNo: "",
    });

    const [address, setAddress] = useState<AddressRequest>({
        neighborhood: "",
        buildingNo: "",
        apartmentNo: "",
        cityId: 0,
        districtId: 0,
    });

    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);

    const [error, setError] = useState("");
    const [errorStatus, setErrorStatus] = useState<number | null>(null);

    // Şehirleri getir
    useEffect(() => {
        api.get<City[]>("/city")
            .then((response) => {
                setCities(response.data);
            })
            .catch((error) => {
                console.error("İller alınamadı:", error);
            });
    }, []);

    // Şehir seçilince ilçeleri getir
    useEffect(() => {
        if (address.cityId === 0) {
            return;
        }

        api.get<District[]>(
            `/district/city/${address.cityId}`
        )
            .then((response) => {
                setDistricts(response.data);
            })
            .catch((error) => {
                console.error("İlçeler alınamadı:", error);
            });
    }, [address.cityId]);

    // Kullanıcı inputlarını yönet
    const handleUserChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: name === "age"
                ? Number(value)
                : value,
        });
    };

    // Adres inputlarını yönet
    const handleAddressChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setAddress({
            ...address,
            [name]: value,
        });
    };

    // Formu gönder
    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        setError("");
        setErrorStatus(null);

        try {
            // Önce kullanıcıyı oluştur
            const userResponse = await api.post(
                "/users",
                form
            );

            const userId = userResponse.data.id;

            // Backend Integer beklediği için
            // text input değerlerini number'a çeviriyoruz.
            const addressData = {
                cityId: address.cityId,
                districtId: address.districtId,
                neighborhood: address.neighborhood,
                buildingNo: Number(address.buildingNo),
                apartmentNo: Number(address.apartmentNo),
            };

            // Adresi oluştur
            await api.post(
                `/users/${userId}/address`,
                addressData
            );

            // Başarılıysa kullanıcılar sayfasına git
            router.push("/users");

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;

                setErrorStatus(status ?? null);

                // Backend'in gönderdiği gerçek mesaj
                const message =
                    error.response?.data?.message ||
                    "Bir hata oluştu.";

                setError(message);

                console.error(
                    "İstek hatası:",
                    error.response?.status,
                    error.response?.data
                );
            } else {
                setError("Bir hata oluştu.");
                setErrorStatus(null);

                console.error(
                    "Bilinmeyen hata:",
                    error
                );
            }
        }
    };

    return (
        <main>
            <h1>Yeni Kullanıcı</h1>

            {/* Backend'den gelen hata */}
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

                <h2>Kullanıcı Bilgileri</h2>

                {/* Ad */}
                <input
                    name="name"
                    type="text"
                    placeholder="Ad"
                    value={form.name}
                    onChange={handleUserChange}
                    required
                    pattern="[A-Za-zÇĞİÖŞÜçğıöşü\s]+"
                    title="Ad sadece harflerden oluşmalıdır."
                />

                {/* Soyad */}
                <input
                    name="surname"
                    type="text"
                    placeholder="Soyad"
                    value={form.surname}
                    onChange={handleUserChange}
                    required
                    pattern="[A-Za-zÇĞİÖŞÜçğıöşü\s]+"
                    title="Soyad sadece harflerden oluşmalıdır."
                />

                {/* Email */}
                <input
                    name="email"
                    type="email"
                    placeholder="E-posta"
                    value={form.email}
                    onChange={handleUserChange}
                    required
                />

                {/* Yaş */}
                <input
                    name="age"
                    type="number"
                    placeholder="Yaş"
                    value={form.age}
                    onChange={handleUserChange}
                    required
                    min={18}
                />

                {/* TC */}
                <input
                    name="tc"
                    type="text"
                    placeholder="TC"
                    value={form.tc}
                    onChange={handleUserChange}
                    required
                    pattern="[0-9]{11}"
                    maxLength={11}
                    title="TC 11 haneli olmalıdır."
                />

                {/* Telefon */}
                <input
                    name="telNo"
                    type="text"
                    placeholder="Telefon"
                    value={form.telNo}
                    onChange={handleUserChange}
                    required
                    pattern="05[0-9]{9}"
                    maxLength={11}
                    title="Telefon 05 ile başlamalı ve 11 haneli olmalıdır."
                />

                <h2>Adres Bilgileri</h2>

                {/* İl */}
                <select
                    value={address.cityId}
                    onChange={(e) => {
                        const cityId =
                            Number(e.target.value);

                        setAddress({
                            ...address,
                            cityId,
                            districtId: 0,
                        });

                        setDistricts([]);
                    }}
                    required
                >
                    <option value={0}>
                        İl seçiniz
                    </option>

                    {cities.map((city) => (
                        <option
                            key={city.id}
                            value={city.id}
                        >
                            {city.name}
                        </option>
                    ))}
                </select>

                {/* İlçe */}
                <select
                    value={address.districtId}
                    onChange={(e) =>
                        setAddress({
                            ...address,
                            districtId:
                                Number(e.target.value),
                        })
                    }
                    disabled={address.cityId === 0}
                    required
                >
                    <option value={0}>
                        İlçe seçiniz
                    </option>

                    {districts.map((district) => (
                        <option
                            key={district.id}
                            value={district.id}
                        >
                            {district.name}
                        </option>
                    ))}
                </select>

                {/* Mahalle */}
                <input
                    name="neighborhood"
                    type="text"
                    placeholder="Mahalle"
                    value={address.neighborhood}
                    onChange={handleAddressChange}
                    required
                />

                {/* Bina No */}
                <input
                    name="buildingNo"
                    type="text"
                    placeholder="Bina No"
                    value={address.buildingNo}
                    onChange={handleAddressChange}
                    required
                    pattern="[0-9]+"
                    title="Bina numarası sadece sayı olmalıdır."
                />

                {/* Daire No */}
                <input
                    name="apartmentNo"
                    type="text"
                    placeholder="Daire No"
                    value={address.apartmentNo}
                    onChange={handleAddressChange}
                    required
                    pattern="[0-9]+"
                    title="Daire numarası sadece sayı olmalıdır."
                />

                <button type="submit">
                    Kullanıcı ve Adres Ekle
                </button>

            </form>
        </main>
    );
}
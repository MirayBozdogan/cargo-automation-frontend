"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

interface Customer {
    id: number;
    name: string;
    surname: string;
}

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
    city: {
        name: string;
    };
    district: {
        name: string;
    };
}

interface Price {
    id: number;
    minDesi: number;
    maxDesi: number;
    price: number;
}

interface ErrorResponse {
    message: string;
}

export default function ShipmentPage() {
    const { id } = useParams();
    const router = useRouter();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [receiverAddresses, setReceiverAddresses] = useState<Address[]>([]);

    const [cities, setCities] = useState<City[]>([]);
    const [senderDistricts, setSenderDistricts] = useState<District[]>([]);
    const [receiverDistricts, setReceiverDistricts] = useState<District[]>([]);

    const [prices, setPrices] = useState<Price[]>([]);

    const [senderManual, setSenderManual] = useState(false);
    const [senderAddressId, setSenderAddressId] = useState("");
    const [senderCity, setSenderCity] = useState("");
    const [senderDistrict, setSenderDistrict] = useState("");
    const [senderAddress, setSenderAddress] = useState("");

    const [receiverManual, setReceiverManual] = useState(false);
    const [receiverId, setReceiverId] = useState("");
    const [receiverAddressId, setReceiverAddressId] = useState("");

    const [receiverName, setReceiverName] = useState("");
    const [receiverSurname, setReceiverSurname] = useState("");
    const [receiverCity, setReceiverCity] = useState("");
    const [receiverDistrict, setReceiverDistrict] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");

    const [width, setWidth] = useState("");
    const [length, setLength] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");

    const [error, setError] = useState("");

    useEffect(() => {
        api.get<Address[]>(`/customers/${id}/address`)
            .then(r => setAddresses(r.data))
            .catch(error =>
                console.error("Gönderici adresleri alınamadı:", error)
            );

        api.get<Customer[]>("/customers/list")
            .then(r => setCustomers(r.data))
            .catch(error =>
                console.error("Müşteriler alınamadı:", error)
            );

        api.get<City[]>("/city")
            .then(r => setCities(r.data))
            .catch(error =>
                console.error("Şehirler alınamadı:", error)
            );

        api.get<Price[]>("/price")
            .then(r => setPrices(r.data))
            .catch(error =>
                console.error("Fiyatlar alınamadı:", error)
            );
    }, [id]);

    // Gönderici şehir seçilince ilçeleri getir
    useEffect(() => {
        if (!senderCity) return;

        const city = cities.find(c => c.name === senderCity);

        if (city) {
            api.get<District[]>(`/district/city/${city.id}`)
                .then(r => setSenderDistricts(r.data))
                .catch(error =>
                    console.error(
                        "Gönderici ilçeleri alınamadı:",
                        error
                    )
                );
        }
    }, [senderCity, cities]);

    // Alıcı şehir seçilince ilçeleri getir
    useEffect(() => {
        if (!receiverCity) return;

        const city = cities.find(c => c.name === receiverCity);

        if (city) {
            api.get<District[]>(`/district/city/${city.id}`)
                .then(r => setReceiverDistricts(r.data))
                .catch(error =>
                    console.error(
                        "Alıcı ilçeleri alınamadı:",
                        error
                    )
                );
        }
    }, [receiverCity, cities]);

    // Kayıtlı alıcı seçilince adreslerini getir
    useEffect(() => {
        if (!receiverId) return;

        api.get<Address[]>(`/customers/${receiverId}/address`)
            .then(r => setReceiverAddresses(r.data))
            .catch(error =>
                console.error(
                    "Alıcı adresleri alınamadı:",
                    error
                )
            );
    }, [receiverId]);

    const validateForm = () => {
        // GÖNDERİCİ

        if (!senderManual && !senderAddressId) {
            return "Gönderici adresi seçmelisiniz.";
        }

        if (
            senderManual &&
            (!senderCity ||
                !senderDistrict ||
                !senderAddress.trim())
        ) {
            return "Gönderici adres bilgilerini eksiksiz doldurmalısınız.";
        }

        // ALICI

        if (!receiverManual && !receiverId) {
            return "Alıcı seçmelisiniz.";
        }

        if (receiverManual) {
            if (
                !receiverName.trim() ||
                !receiverSurname.trim() ||
                !receiverCity ||
                !receiverDistrict ||
                !receiverAddress.trim()
            ) {
                return "Kayıtsız alıcının bilgilerini eksiksiz doldurmalısınız.";
            }
        }

        if (
            !receiverManual &&
            !receiverAddressId &&
            (!receiverCity ||
                !receiverDistrict ||
                !receiverAddress.trim())
        ) {
            return "Alıcı adres bilgilerini eksiksiz doldurmalısınız.";
        }

        // ÖLÇÜLER

        if (!width || !length || !height || !weight) {
            return "En, boy, yükseklik ve ağırlık bilgilerini girmelisiniz.";
        }

        const widthValue = Number(width);
        const lengthValue = Number(length);
        const heightValue = Number(height);
        const weightValue = Number(weight);

        if (
            widthValue <= 0 ||
            lengthValue <= 0 ||
            heightValue <= 0 ||
            weightValue <= 0
        ) {
            return "En, boy, yükseklik ve ağırlık 0'dan büyük olmalıdır.";
        }

        // DESİ

        const desi =
            (widthValue * lengthValue * heightValue) / 3000;

        const calculatedValue = Math.max(
            desi,
            weightValue
        );

        // FİYAT

        const priceExists = prices.some(
            price =>
                calculatedValue >= price.minDesi &&
                calculatedValue < price.maxDesi
        );

        if (!priceExists) {
            return "Hesaplanan değer için uygun bir fiyat bulunamadı.";
        }

        return null;
    };

    const createShipment = async () => {
        setError("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const data = {
            width: Number(width),
            length: Number(length),
            height: Number(height),
            weight: Number(weight),

            senderId: Number(id),

            ...(senderManual
                ? {
                    senderCity,
                    senderDistrict,
                    senderAddressText: senderAddress
                }
                : {
                    senderAddressId: Number(senderAddressId)
                }),

            ...(receiverManual
                ? {
                    receiverName,
                    receiverSurname,
                    receiverCity,
                    receiverDistrict,
                    receiverAddressText: receiverAddress
                }
                : {
                    receiverId: Number(receiverId),

                    ...(receiverAddressId
                        ? {
                            receiverAddressId: Number(
                                receiverAddressId
                            )
                        }
                        : {
                            receiverCity,
                            receiverDistrict,
                            receiverAddressText: receiverAddress
                        })
                })
        };

        try {
            const response = await api.post(
                "/shipment",
                data
            );

            console.log(
                "Oluşturulan gönderi:",
                response.data
            );

            alert("Gönderi oluşturuldu.");

            router.push(`/customers/${id}`);
        } catch (error: unknown) {
            console.error(
                "Gönderi oluşturulamadı:",
                error
            );

            if (axios.isAxiosError<ErrorResponse>(error)) {
                setError(
                    error.response?.data?.message ||
                    "Gönderi oluşturulamadı."
                );
            } else {
                setError("Beklenmeyen bir hata oluştu.");
            }
        }
    };

    return (
        <main>
            <h1>Gönderi Oluştur</h1>

            <div className="shipment-container">
            {/* GÖNDERİCİ */}

                <div className="customer-info">
            <h2>Gönderici</h2>

            <p>Müşteri ID: {id}</p>

            <label>Adres Türü</label>

            <select
                value={senderManual ? "manual" : "saved"}
                onChange={e => {
                    setSenderManual(e.target.value === "manual");
                    setSenderAddressId("");

                    if (e.target.value === "saved") {
                        setSenderCity("");
                        setSenderDistrict("");
                        setSenderAddress("");
                    }
                }}
            >
                <option value="saved">Kayıtlı Adres</option>
                <option value="manual">Manuel Adres</option>
            </select>

                    <br/>
            {!senderManual ? (
                <select
                    value={senderAddressId}
                    onChange={e =>
                        setSenderAddressId(e.target.value)
                    }
                >
                    <option value="">Adres seç</option>

                    {addresses.map(address => (
                        <option
                            key={address.id}
                            value={address.id}
                        >
                            {address.city.name} /{" "}
                            {address.district.name} /{" "}
                            {address.neighborhood}
                        </option>
                    ))}
                </select>
            ) : (
                <>
                    <select
                        value={senderCity}
                        onChange={e => {
                            setSenderCity(e.target.value);
                            setSenderDistrict("");
                            setSenderDistricts([]);
                        }}
                    >
                        <option value="">Şehir seç</option>

                        {cities.map(city => (
                            <option
                                key={city.id}
                                value={city.name}
                            >
                                {city.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={senderDistrict}
                        onChange={e =>
                            setSenderDistrict(e.target.value)
                        }
                        disabled={!senderCity}
                    >
                        <option value="">İlçe seç</option>

                        {senderDistricts.map(district => (
                            <option
                                key={district.id}
                                value={district.name}
                            >
                                {district.name}
                            </option>
                        ))}
                    </select>

                    <input
                        placeholder="Adres"
                        value={senderAddress}
                        onChange={e =>
                            setSenderAddress(e.target.value)
                        }
                    />
                </>
            )}

                    <br/>
                    <br/>
                    <br/>
            {/* ALICI */}

            <h2>Alıcı</h2>

            <label>Alıcı Türü</label>

            <select
                value={receiverManual ? "manual" : "customer"}
                onChange={e => {
                    setReceiverManual(
                        e.target.value === "manual"
                    );
                    setReceiverId("");
                    setReceiverAddressId("");
                    setReceiverAddresses([]);
                }}
            >
                <option value="customer">
                    Kayıtlı Müşteri
                </option>

                <option value="manual">
                    Kayıtsız Kişi
                </option>
            </select>

                    <br/>
            {!receiverManual ? (
                <>
                    <select
                        value={receiverId}
                        onChange={e => {
                            setReceiverId(e.target.value);
                            setReceiverAddressId("");
                            setReceiverCity("");
                            setReceiverDistrict("");
                            setReceiverAddress("");
                        }}
                    >


                        <option value="">Alıcı seç</option>

                        {customers
                            .filter(
                                customer =>
                                    customer.id !== Number(id)
                            )
                            .map(customer => (
                                <option
                                    key={customer.id}
                                    value={customer.id}
                                >
                                    {customer.name}{" "}
                                    {customer.surname}
                                </option>
                            ))}
                    </select>

                    <br/>
                    <br/>
                    <label>Adres Türü</label>

                    <select
                        value={receiverAddressId}
                        onChange={e => {
                            setReceiverAddressId(
                                e.target.value
                            );

                            if (e.target.value) {
                                setReceiverCity("");
                                setReceiverDistrict("");
                                setReceiverAddress("");
                            }
                        }}
                    >
                        <option value="">
                            Manuel Adres
                        </option>

                        {receiverAddresses.map(address => (
                            <option
                                key={address.id}
                                value={address.id}
                            >
                                {address.city.name} /
                                {address.district.name} /
                                {address.neighborhood}
                            </option>
                        ))}
                    </select>

                    <br/>
                    {!receiverAddressId && (
                        <>
                            <select
                                value={receiverCity}
                                onChange={e => {
                                    setReceiverCity(e.target.value);
                                    setReceiverDistrict("");
                                    setReceiverDistricts([]);
                                }}
                            >
                                <option value="">
                                    Şehir seç
                                </option>

                                {cities.map(city => (
                                    <option
                                        key={city.id}
                                        value={city.name}
                                    >
                                        {city.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={receiverDistrict}
                                onChange={e =>
                                    setReceiverDistrict(
                                        e.target.value
                                    )
                                }
                                disabled={!receiverCity}
                            >
                                <option value="">
                                    İlçe seç
                                </option>

                                {receiverDistricts.map(
                                    district => (
                                        <option
                                            key={district.id}
                                            value={district.name}
                                        >
                                            {district.name}
                                        </option>
                                    )
                                )}
                            </select>

                            <input
                                placeholder="Adres"
                                value={receiverAddress}
                                onChange={e =>
                                    setReceiverAddress(
                                        e.target.value
                                    )
                                }
                            />
                        </>
                    )}
                </>
            ) : (
                <>
                    <input
                        placeholder="Ad"
                        value={receiverName}
                        onChange={e =>
                            setReceiverName(e.target.value)
                        }
                    />

                    <input
                        placeholder="Soyad"
                        value={receiverSurname}
                        onChange={e =>
                            setReceiverSurname(e.target.value)
                        }
                    />

                    <select
                        value={receiverCity}
                        onChange={e => {
                            setReceiverCity(e.target.value);
                            setReceiverDistrict("");
                            setReceiverDistricts([]);
                        }}
                    >
                        <option value="">
                            Şehir seç
                        </option>

                        {cities.map(city => (
                            <option
                                key={city.id}
                                value={city.name}
                            >
                                {city.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={receiverDistrict}
                        onChange={e =>
                            setReceiverDistrict(
                                e.target.value
                            )
                        }
                        disabled={!receiverCity}
                    >
                        <option value="">
                            İlçe seç
                        </option>

                        {receiverDistricts.map(
                            district => (
                                <option
                                    key={district.id}
                                    value={district.name}
                                >
                                    {district.name}
                                </option>
                            )
                        )}
                    </select>

                    <input
                        placeholder="Adres"
                        value={receiverAddress}
                        onChange={e =>
                            setReceiverAddress(
                                e.target.value
                            )
                        }
                    />
                </>
            )}

                </div>

                <div className="shipment-info">
            {/* GÖNDERİ BİLGİLERİ */}

            <h2>Gönderi Bilgileri</h2>

            <input
                type="number"
                placeholder="En"
                value={width}
                onChange={e =>
                    setWidth(e.target.value)
                }
            />

            <input
                type="number"
                placeholder="Boy"
                value={length}
                onChange={e =>
                    setLength(e.target.value)
                }
            />

            <input
                type="number"
                placeholder="Yükseklik"
                value={height}
                onChange={e =>
                    setHeight(e.target.value)
                }
            />

            <input
                type="number"
                placeholder="Ağırlık"
                value={weight}
                onChange={e =>
                    setWeight(e.target.value)
                }
            />

            <br />

            {error && (
                <p
                    style={{
                        color: "red",
                        marginTop: "10px"
                    }}
                >
                    {error}
                </p>
            )}

            <button onClick={createShipment}>
                Gönderiyi Oluştur
            </button>

            <button
                onClick={() =>
                    router.push(`/customers/${id}`)
                }
            >
                İptal
            </button>

                </div>
            </div>
        </main>
    );
}
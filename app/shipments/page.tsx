"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";

interface City {
    id: number;
    name: string;
}

interface District {
    id: number;
    name: string;
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
    const [cities, setCities] = useState<City[]>([]);
    const [senderDistricts, setSenderDistricts] = useState<District[]>([]);
    const [receiverDistricts, setReceiverDistricts] = useState<District[]>([]);
    const [prices, setPrices] = useState<Price[]>([]);

    const [error, setError] = useState("");

    const [sender, setSender] = useState({
        name: "",
        surname: "",
        city: "",
        district: "",
        address: ""
    });

    const [receiver, setReceiver] = useState({
        name: "",
        surname: "",
        city: "",
        district: "",
        address: ""
    });

    const [shipment, setShipment] = useState({
        width: "",
        length: "",
        height: "",
        weight: ""
    });

    // Şehirleri ve fiyatları getir
    useEffect(() => {
        api.get<City[]>("/city")
            .then(res => setCities(res.data))
            .catch(error =>
                console.error("Şehirler alınamadı:", error)
            );

        api.get<Price[]>("/price")
            .then(res => {
                console.log("FİYATLAR:", res.data);
                setPrices(res.data);
            })
    }, [shipment]);

    // Gönderici ilçelerini getir
    useEffect(() => {
        const city = cities.find(
            c => c.name === sender.city
        );

        if (!city) return;

        api.get<District[]>(
            `/district/city/${city.id}`
        )
            .then(res => setSenderDistricts(res.data))
            .catch(error =>
                console.error(
                    "Gönderici ilçeleri alınamadı:",
                    error
                )
            );
    }, [sender.city, cities]);

    // Alıcı ilçelerini getir
    useEffect(() => {
        const city = cities.find(
            c => c.name === receiver.city
        );

        if (!city) return;

        api.get<District[]>(
            `/district/city/${city.id}`
        )
            .then(res => setReceiverDistricts(res.data))
            .catch(error =>
                console.error(
                    "Alıcı ilçeleri alınamadı:",
                    error
                )
            );
    }, [receiver.city, cities]);

    const validateForm = () => {
        // GÖNDERİCİ KONTROLÜ

        if (
            !sender.name.trim() ||
            !sender.surname.trim() ||
            !sender.city ||
            !sender.district ||
            !sender.address.trim()
        ) {
            return "Gönderici bilgilerini eksiksiz doldurmalısınız.";
        }

        // ALICI KONTROLÜ

        if (
            !receiver.name.trim() ||
            !receiver.surname.trim() ||
            !receiver.city ||
            !receiver.district ||
            !receiver.address.trim()
        ) {
            return "Alıcı bilgilerini eksiksiz doldurmalısınız.";
        }

        // ÖLÇÜ KONTROLÜ

        if (
            !shipment.width ||
            !shipment.length ||
            !shipment.height ||
            !shipment.weight
        ) {
            return "En, boy, yükseklik ve ağırlık bilgilerini girmelisiniz.";
        }

        const width = Number(shipment.width);
        const length = Number(shipment.length);
        const height = Number(shipment.height);
        const weight = Number(shipment.weight);

        if (
            width <= 0 ||
            length <= 0 ||
            height <= 0 ||
            weight <= 0
        ) {
            return "En, boy, yükseklik ve ağırlık 0'dan büyük olmalıdır.";
        }

        // DESİ HESAPLAMA

        const desi =
            (width * length * height) / 3000;

        const calculatedValue = Math.max(
            desi,
            weight
        );

        // FİYAT KONTROLÜ

        const priceExists = prices.some(
            price =>
                calculatedValue >= price.minDesi &&
                calculatedValue < price.maxDesi

        );

        console.log("Desi:", desi);
        console.log("Hesaplanan değer:", calculatedValue);
        console.log("Fiyatlar:", prices);

        if (!priceExists) {
            return "Hesaplanan değer için uygun bir fiyat bulunamadı.";
        }

        return null;
    };

    const createShipment = async () => {
        setError("");

        // Backend'e gitmeden önce kontrol
        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const data = {
            width: Number(shipment.width),
            length: Number(shipment.length),
            height: Number(shipment.height),
            weight: Number(shipment.weight),

            senderName: sender.name,
            senderSurname: sender.surname,
            senderCity: sender.city,
            senderDistrict: sender.district,
            senderAddressText: sender.address,

            receiverName: receiver.name,
            receiverSurname: receiver.surname,
            receiverCity: receiver.city,
            receiverDistrict: receiver.district,
            receiverAddressText: receiver.address
        };

        try {
            await api.post("/shipment", data);

            alert("Gönderi oluşturuldu.");

            setSender({
                name: "",
                surname: "",
                city: "",
                district: "",
                address: ""
            });

            setReceiver({
                name: "",
                surname: "",
                city: "",
                district: "",
                address: ""
            });

            setShipment({
                width: "",
                length: "",
                height: "",
                weight: ""
            });

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

                <div className="user-info">

                    {/* GÖNDERİCİ */}

                    <h2>Gönderici</h2>

                    <input
                        placeholder="Ad"
                        value={sender.name}
                        onChange={e =>
                            setSender({
                                ...sender,
                                name: e.target.value
                            })
                        }
                    />

                    <input
                        placeholder="Soyad"
                        value={sender.surname}
                        onChange={e =>
                            setSender({
                                ...sender,
                                surname: e.target.value
                            })
                        }
                    />

                    <br />
                    <br />

                    <select
                        value={sender.city}
                        onChange={e =>
                            setSender({
                                ...sender,
                                city: e.target.value,
                                district: ""
                            })
                        }
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
                        value={sender.district}
                        disabled={!sender.city}
                        onChange={e =>
                            setSender({
                                ...sender,
                                district: e.target.value
                            })
                        }
                    >
                        <option value="">
                            İlçe seç
                        </option>

                        {senderDistricts.map(
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
                        value={sender.address}
                        onChange={e =>
                            setSender({
                                ...sender,
                                address: e.target.value
                            })
                        }
                    />

                    <br />
                    <br />
                    <br />
                    <br />

                    {/* ALICI */}

                    <h2>Alıcı</h2>

                    <input
                        placeholder="Ad"
                        value={receiver.name}
                        onChange={e =>
                            setReceiver({
                                ...receiver,
                                name: e.target.value
                            })
                        }
                    />

                    <input
                        placeholder="Soyad"
                        value={receiver.surname}
                        onChange={e =>
                            setReceiver({
                                ...receiver,
                                surname: e.target.value
                            })
                        }
                    />

                    <br />
                    <br />

                    <select
                        value={receiver.city}
                        onChange={e =>
                            setReceiver({
                                ...receiver,
                                city: e.target.value,
                                district: ""
                            })
                        }
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
                        value={receiver.district}
                        disabled={!receiver.city}
                        onChange={e =>
                            setReceiver({
                                ...receiver,
                                district: e.target.value
                            })
                        }
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
                        value={receiver.address}
                        onChange={e =>
                            setReceiver({
                                ...receiver,
                                address: e.target.value
                            })
                        }
                    />

                </div>

                <div className="shipment-info">

                    {/* GÖNDERİ */}

                    <h2>Gönderi Bilgileri</h2>

                    <input
                        type="number"
                        placeholder="En"
                        value={shipment.width}
                        onChange={e =>
                            setShipment({
                                ...shipment,
                                width: e.target.value
                            })
                        }
                    />

                    <input
                        type="number"
                        placeholder="Boy"
                        value={shipment.length}
                        onChange={e =>
                            setShipment({
                                ...shipment,
                                length: e.target.value
                            })
                        }
                    />

                    <br />
                    <br />

                    <input
                        type="number"
                        placeholder="Yükseklik"
                        value={shipment.height}
                        onChange={e =>
                            setShipment({
                                ...shipment,
                                height: e.target.value
                            })
                        }
                    />

                    <input
                        type="number"
                        placeholder="Ağırlık"
                        value={shipment.weight}
                        onChange={e =>
                            setShipment({
                                ...shipment,
                                weight: e.target.value
                            })
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

                </div>

            </div>
        </main>
    );
}
"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";

interface User { id: number; name: string; surname: string }
interface City { id: number; name: string }
interface District { id: number; name: string; city: City }
interface Address { id: number; neighborhood: string; city: City; district: District }
interface ShipmentResponse { id: number; barcode: string; price: number }
interface CalculatePriceResponse { desi: number; calculatedValue: number; calculatedBy: string; price: number }
interface PricePreview { measurements: string; result: CalculatePriceResponse }
interface ManualAddress { cityId: string; districtId: string; address: string }
const emptyAddress: ManualAddress = { cityId: "", districtId: "", address: "" };

function AddressFields({ prefix, value, onChange, cities, districts }: {
    prefix: string; value: ManualAddress; onChange: (value: ManualAddress) => void; cities: City[]; districts: District[];
}) {
    return <>
        <label htmlFor={`${prefix}-city`}>Şehir</label>
        <select id={`${prefix}-city`} required value={value.cityId} onChange={e => onChange({ ...value, cityId: e.target.value, districtId: "" })}>
            <option value="">Şehir seç</option>{cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
        </select>
        <label htmlFor={`${prefix}-district`}>İlçe</label>
        <select id={`${prefix}-district`} required disabled={!value.cityId} value={value.districtId} onChange={e => onChange({ ...value, districtId: e.target.value })}>
            <option value="">İlçe seç</option>{districts.filter(d => String(d.city.id) === value.cityId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label htmlFor={`${prefix}-address`}>Açık adres</label>
        <textarea id={`${prefix}-address`} required value={value.address} onChange={e => onChange({ ...value, address: e.target.value })} />
    </>;
}
export default function ShipmentPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [senderAddressId, setSenderAddressId] = useState("");
    const [sender, setSender] = useState(emptyAddress);
    const [receiver, setReceiver] = useState(emptyAddress);
    const [receiverName, setReceiverName] = useState("");
    const [receiverSurname, setReceiverSurname] = useState("");
    const [shipment, setShipment] = useState({ width: "", length: "", height: "", weight: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [calculating, setCalculating] = useState(false);
    const [priceError, setPriceError] = useState("");
    const [preview, setPreview] = useState<PricePreview | null>(null);
    const measurements = JSON.stringify(shipment);
    const currentPreview = preview?.measurements === measurements ? preview.result : null;
    const formatPrice = (price: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
    const [created, setCreated] = useState<ShipmentResponse | null>(null);
    useEffect(() => {
        if (!localStorage.getItem("token")) { router.replace("/"); return; }
        let active = true;
        async function load() {
            try {
                const [me, cityResponse, districtResponse] = await Promise.all([
                    api.get<User>("/users/me"), api.get<City[]>("/city"), api.get<District[]>("/district"),
                ]);
                const addressResponse = await api.get<Address[]>(`/users/${me.data.id}/address`);
                if (active) { setUser(me.data); setCities(cityResponse.data); setDistricts(districtResponse.data); setAddresses(addressResponse.data); }
            } catch { if (active) setError("Form bilgileri yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsin."); }
            finally { if (active) setLoading(false); }
        }
        void load(); return () => { active = false; };
    }, [router]);
    async function calculatePrice() {
        if (calculating || saving) return;
        setPriceError(""); setPreview(null);
        const values = {
            width: Number(shipment.width), length: Number(shipment.length),
            height: Number(shipment.height), weight: Number(shipment.weight),
        };
        if (Object.values(values).some(value => !Number.isFinite(value) || value <= 0)) {
            setPriceError("Fiyat hesaplamak için tüm ölçüleri 0'dan büyük girmelisin.");
            return;
        }
        setCalculating(true);
        try {
            const response = await api.post<CalculatePriceResponse>("/shipment/calculate-price", values);
            setPreview({ measurements, result: response.data });
        } catch (error) {
            setPriceError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Fiyat hesaplanamadı." : "Fiyat hesaplanamadı.");
        } finally { setCalculating(false); }
    }
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || calculating || !user || created) return;
        setError("");
        if (!receiverName.trim() || !receiverSurname.trim() || !receiver.address.trim() || (!senderAddressId && !sender.address.trim())) {
            setError("Ad, soyad ve adres alanları boş olamaz."); return;
        }
        function manualAddress(value: ManualAddress) {
            const city = cities.find(c => String(c.id) === value.cityId);
            const district = districts.find(d => String(d.id) === value.districtId && d.city.id === city?.id);
            if (!city || !district) throw new Error("Şehir ve ilçeyi seçmelisin.");
            return { city: city.name, district: district.name, address: value.address.trim() };
        }
        setSaving(true);
        try {
            const receiverAddress = manualAddress(receiver);
            const senderAddress = senderAddressId ? null : manualAddress(sender);
            const response = await api.post<ShipmentResponse>("/shipment", {
                width: Number(shipment.width), length: Number(shipment.length), height: Number(shipment.height), weight: Number(shipment.weight),
                ...(senderAddressId ? { senderAddressId: Number(senderAddressId) } : {
                    senderCity: senderAddress?.city, senderDistrict: senderAddress?.district, senderAddressText: senderAddress?.address,
                }),
                receiverName: receiverName.trim(), receiverSurname: receiverSurname.trim(),
                receiverCity: receiverAddress.city, receiverDistrict: receiverAddress.district, receiverAddressText: receiverAddress.address,
            });
            setCreated(response.data);
        } catch (error) { setError(axios.isAxiosError<{ message: string }>(error)
            ? error.response?.data?.message || "Gönderi oluşturulamadı." : error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu."); }
        finally { setSaving(false); }
    }
    if (loading) return <main><p role="status">Gönderi formu yükleniyor...</p></main>;
    if (!user) return <main><p role="alert">{error}</p></main>;
    if (created) return <main><h1>Gönderi oluşturuldu</h1><p role="status">Gönderin kaydedildi.</p>
        <p>Takip numarası (barkod): <strong>{created.barcode}</strong></p>
        <p>Kargo ücreti: {formatPrice(created.price)}</p>
        <Link href={`/users/${user.id}`}>Gönderilerimi görüntüle</Link></main>;
    return <main><h1>Gönderi Oluştur</h1><form onSubmit={handleSubmit}>
        <fieldset disabled={saving || calculating} className="registration-fields">
            <h2>Gönderici</h2><p>{user.name} {user.surname}</p>
            <label htmlFor="senderAddressId">Gönderici adresi</label>
            <select id="senderAddressId" value={senderAddressId} onChange={e => setSenderAddressId(e.target.value)}>
                <option value="">Adresi elle gir</option>{addresses.map(address => <option key={address.id} value={address.id}>
                    {address.city.name} / {address.district.name} — {address.neighborhood}</option>)}
            </select>
            {!addresses.length && <p>Kayıtlı adresin yok. Adresi elle girebilir veya <Link href="/addresses">adres ekleyebilirsin</Link>.</p>}
            {!senderAddressId && <AddressFields prefix="sender" value={sender} onChange={setSender} cities={cities} districts={districts} />}
            <h2>Alıcı</h2><label htmlFor="receiverName">Ad</label>
            <input id="receiverName" required value={receiverName} onChange={e => setReceiverName(e.target.value)} />
            <label htmlFor="receiverSurname">Soyad</label><input id="receiverSurname" required value={receiverSurname} onChange={e => setReceiverSurname(e.target.value)} />
            <AddressFields prefix="receiver" value={receiver} onChange={setReceiver} cities={cities} districts={districts} />
            <h2>Ölçüler</h2>
            {([['width', 'En (cm)'], ['length', 'Boy (cm)'], ['height', 'Yükseklik (cm)'], ['weight', 'Ağırlık (kg)']] as const).map(([field, label]) => <div key={field}>
                <label htmlFor={field}>{label}</label><input id={field} type="number" required min="0.01" step="0.01" value={shipment[field]}
                    onChange={e => setShipment({ ...shipment, [field]: e.target.value })} />
            </div>)}
            <button type="button" onClick={calculatePrice}>{calculating ? "Hesaplanıyor..." : "Fiyatı hesapla"}</button>
            {priceError && <p role="alert">{priceError}</p>}
            {currentPreview && <div role="status">
                <p>Önizleme ücreti: {formatPrice(currentPreview.price)}</p>
                <p>Desi: {currentPreview.desi} — Ücrete esas değer: {currentPreview.calculatedValue}</p>
                <p>Hesaplama türü: {currentPreview.calculatedBy === "DESI" ? "Desi" : currentPreview.calculatedBy === "WEIGHT" ? "Ağırlık" : currentPreview.calculatedBy}</p>
                <p>Gönderi kaydedilirken ücret backend tarafından yeniden hesaplanır.</p>
            </div>}
            {preview && !currentPreview && <p>Ölçüler değişti. Güncel fiyat için tekrar hesapla.</p>}
            {error && <p role="alert" className="deleteError">{error}</p>}
            <button type="submit">{saving ? "Kaydediliyor..." : "Gönderi oluştur"}</button>
        </fieldset></form></main>;
}

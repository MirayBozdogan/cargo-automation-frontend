"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";

type Location = { id: number; name: string };
type Address = { id: number; city: Location; district: Location; neighborhood: string; buildingNo: number | null; apartmentNo: number | null };
const emptyForm = { cityId: "", districtId: "", neighborhood: "", buildingNo: "", apartmentNo: "" };
function message(error: unknown, fallback: string) {
    return axios.isAxiosError<{ message: string }>(error) ? error.response?.data?.message || fallback : fallback;
}
export default function AddressesPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<number | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [cities, setCities] = useState<Location[]>([]);
    const [districts, setDistricts] = useState<Location[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [districtsLoading, setDistrictsLoading] = useState(false);
    const [error, setError] = useState("");
    const [districtError, setDistrictError] = useState("");
    const [success, setSuccess] = useState("");
    useEffect(() => {
        if (!localStorage.getItem("token")) { router.replace("/"); return; }
        let active = true;
        async function load() {
            try {
                const [user, cityResponse] = await Promise.all([api.get<{ id: number }>("/users/me"), api.get<Location[]>("/city")]);
                const response = await api.get<Address[]>(`/users/${user.data.id}/address`);
                if (active) { setUserId(user.data.id); setCities(cityResponse.data); setAddresses(response.data); }
            } catch (error) { if (active) setError(message(error, "Adresler yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsin.")); }
            finally { if (active) setLoading(false); }
        }
        void load();
        return () => { active = false; };
    }, [router]);
    useEffect(() => {
        if (!form.cityId) return;
        let active = true;
        api.get<Location[]>(`/district/city/${form.cityId}`)
            .then(response => { if (active) setDistricts(response.data); })
            .catch(error => { if (active) setDistrictError(message(error, "İlçeler yüklenemedi. Şehri yeniden seçerek deneyebilirsin.")); })
            .finally(() => { if (active) setDistrictsLoading(false); });
        return () => { active = false; };
    }, [form.cityId]);
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || userId === null) return;
        setError(""); setSuccess("");
        if (!form.neighborhood.trim()) { setError("Mahalle boş olamaz."); return; }
        setSaving(true);
        try {
            const response = await api.post<Address>(`/users/${userId}/address`, {
                cityId: Number(form.cityId), districtId: Number(form.districtId), neighborhood: form.neighborhood.trim(),
                buildingNo: form.buildingNo === "" ? null : Number(form.buildingNo),
                apartmentNo: form.apartmentNo === "" ? null : Number(form.apartmentNo),
            });
            setAddresses(current => [...current, response.data]); setForm(emptyForm);
            setDistricts([]); setDistrictError(""); setDistrictsLoading(false); setSuccess("Adres kaydedildi.");
        } catch (error) { setError(message(error, "Adres kaydedilemedi. Lütfen tekrar deneyin.")); }
        finally { setSaving(false); }
    }
    return <main>
        <h1>Adreslerim</h1>
        {loading && <p role="status">Adresler yükleniyor...</p>}
        {error && <p role="alert" className="deleteError">{error}</p>}
        {!loading && userId !== null && <>
            {addresses.length === 0 ? <p>Henüz kayıtlı adresin yok. Aşağıdaki formdan adres ekleyebilirsin.</p>
                : <ul>{addresses.map(address => <li key={address.id}>
                    {address.city.name} / {address.district.name} — {address.neighborhood}
                    {address.buildingNo !== null && `, Bina No: ${address.buildingNo}`}
                    {address.apartmentNo !== null && `, Daire No: ${address.apartmentNo}`}
                </li>)}</ul>}
            <h2>Yeni adres ekle</h2>
            {success && <p role="status">{success}</p>}
            <form onSubmit={handleSubmit}>
                <fieldset disabled={saving} className="registration-fields">
                    <label htmlFor="cityId">Şehir</label>
                    <select id="cityId" required value={form.cityId} onChange={event => {
                        const cityId = event.target.value;
                        setForm({ ...form, cityId, districtId: "" }); setDistricts([]);
                        setDistrictError(""); setDistrictsLoading(Boolean(cityId));
                    }}>
                        <option value="">Şehir seç</option>
                        {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                    </select>
                    <label htmlFor="districtId">İlçe</label>
                    <select id="districtId" required disabled={!form.cityId || districtsLoading || Boolean(districtError)}
                        value={form.districtId} onChange={event => setForm({ ...form, districtId: event.target.value })}>
                        <option value="">{districtsLoading ? "İlçeler yükleniyor..." : "İlçe seç"}</option>
                        {districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}
                    </select>
                    {districtError && <p role="alert">{districtError}</p>}
                    <label htmlFor="neighborhood">Mahalle</label>
                    <input id="neighborhood" required maxLength={100} value={form.neighborhood} onChange={event => setForm({ ...form, neighborhood: event.target.value })} />
                    <label htmlFor="buildingNo">Bina numarası (isteğe bağlı)</label>
                    <input id="buildingNo" type="number" min={1} max={2147483647} step={1} value={form.buildingNo} onChange={event => setForm({ ...form, buildingNo: event.target.value })} />
                    <label htmlFor="apartmentNo">Daire numarası (isteğe bağlı)</label>
                    <input id="apartmentNo" type="number" min={1} max={2147483647} step={1} value={form.apartmentNo} onChange={event => setForm({ ...form, apartmentNo: event.target.value })} />
                    <button type="submit" disabled={saving || districtsLoading || !form.districtId}>{saving ? "Kaydediliyor..." : "Adresi kaydet"}</button>
                </fieldset>
            </form>
        </>}
    </main>;
}

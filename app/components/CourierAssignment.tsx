"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import api from "@/lib/api";
import { fullName } from "@/lib/shipment-display";

interface Courier { id: number; name: string | null; surname: string | null }
interface CourierPage { content: Courier[]; number: number; totalPages: number; totalElements: number }
export default function CourierAssignment({ busy, onAssign }: { busy: boolean; onAssign: (id: number) => Promise<void> }) {
    const [request, setRequest] = useState({ page: 0, revision: 0 });
    const [result, setResult] = useState<CourierPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState("");
    useEffect(() => {
        let active = true;
        api.get<CourierPage>("/shipment/couriers", { params: { page: request.page, size: 10 } }).then(response => {
            if (!active) return;
            if (request.page > 0 && request.page >= response.data.totalPages) {
                setRequest(current => ({ ...current, page: Math.max(0, response.data.totalPages - 1) })); return;
            }
            setResult(response.data); setLoading(false);
        }).catch(error => {
            if (!active) return;
            setError(axios.isAxiosError<{ message: string }>(error) ? error.response?.data?.message || "Personeller yüklenemedi." : "Personeller yüklenemedi.");
            setLoading(false);
        });
        return () => { active = false; };
    }, [request]);
    function reload(page: number) {
        setLoading(true); setError(""); setSelected("");
        setRequest(current => ({ page, revision: current.revision + 1 }));
    }
    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy || loading || error || !result?.content.some(courier => String(courier.id) === selected)) return;
        void onAssign(Number(selected));
    }
    return <div>
        <p>Aktif personellerden birini seç. Atama yapıldığında gönderi dağıtıma çıkar.</p>
        {loading ? <p role="status">Personeller yükleniyor...</p> : error ? <div role="alert"><p>{error}</p>
            <button disabled={busy} onClick={() => reload(request.page)}>Personelleri tekrar yükle</button></div>
            : result && (result.totalElements === 0 ? <p>Atanabilecek aktif personel bulunamadı.</p> : <>
                <form onSubmit={submit}>
                    <fieldset className="registration-fields" disabled={busy}>
                        <label htmlFor="courierId">Kurye olarak atanacak personel</label>
                        <select id="courierId" required value={selected} onChange={event => setSelected(event.target.value)}>
                            <option value="">Personel seç</option>
                            {result.content.map(courier => <option key={courier.id} value={courier.id}>{fullName(courier.name, courier.surname)} — #{courier.id}</option>)}
                        </select>
                        <button type="submit" disabled={!selected || busy}>{busy ? "Atanıyor..." : "Kurye ata ve dağıtıma çıkar"}</button>
                    </fieldset>
                </form>
                <div className="staff-actions">
                    <button disabled={busy || request.page === 0} onClick={() => reload(request.page - 1)}>Önceki personeller</button>
                    <span>Personel sayfası {result.number + 1} / {result.totalPages}</span>
                    <button disabled={busy || request.page + 1 >= result.totalPages} onClick={() => reload(request.page + 1)}>Sonraki personeller</button>
                    <button disabled={busy} onClick={() => reload(request.page)}>Personelleri yenile</button>
                </div>
            </>)}
    </div>;
}

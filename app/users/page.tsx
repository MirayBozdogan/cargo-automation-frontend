"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "../components/AuthProvider";

interface User {
    id: number; name: string; surname: string; email: string;
    age: number; telNo: string; active: boolean;
}
interface UserPage { content: User[]; totalPages: number; totalElements: number; number: number }
interface CustomerFilters { name: string; surname: string; email: string; telNo: string; active: string }
interface SearchRequest { page: number; filters: Partial<CustomerFilters>; revision: number }
const emptyFilters: CustomerFilters = { name: "", surname: "", email: "", telNo: "", active: "" };

export default function UsersPage() {
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [loading, error, user, router]);
    if (loading) return <main><p role="status">Yetkiler kontrol ediliyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (user.role !== "STAFF" && user.role !== "ADMIN") return <main><h1>Müşteriler</h1><p role="alert">Müşteri listesini yalnız personel ve yöneticiler görebilir.</p></main>;
    return <CustomerList key={user.id} />;
}
function CustomerList() {
    const [form, setForm] = useState<CustomerFilters>(emptyFilters);
    const [request, setRequest] = useState<SearchRequest>({ page: 0, filters: {}, revision: 0 });
    const [result, setResult] = useState<UserPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        api.get<UserPage>("/users", { params: { ...request.filters, page: request.page, size: 10, sort: "id,desc" } })
            .then(response => {
                if (!active) return;
                if (request.page > 0 && request.page >= response.data.totalPages) {
                    setRequest(current => ({ ...current, page: Math.max(0, response.data.totalPages - 1) }));
                    return;
                }
                setResult(response.data); setError(""); setLoading(false);
            })
            .catch(error => {
                if (!active) return;
                setError(axios.isAxiosError<{ message: string }>(error) ? error.response?.data?.message || "Müşteriler yüklenemedi." : "Müşteriler yüklenemedi.");
                setLoading(false);
            });
        return () => { active = false; };
    }, [request]);
    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;
        const filters = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value !== ""));
        setLoading(true); setError("");
        setRequest(current => ({ page: 0, filters, revision: current.revision + 1 }));
    }
    function reset() {
        if (loading) return;
        setForm(emptyFilters); setLoading(true); setError("");
        setRequest(current => ({ page: 0, filters: {}, revision: current.revision + 1 }));
    }
    function changePage(page: number) {
        if (loading) return;
        setLoading(true); setError(""); setRequest(current => ({ ...current, page }));
    }
    function retry() {
        setLoading(true); setError(""); setRequest(current => ({ ...current, revision: current.revision + 1 }));
    }
    return <main>
        <h1>Müşteriler</h1>
        <p>Ad, soyad, e-posta veya telefonla ara. Birden fazla alan doldurursan tüm koşulları karşılayan müşteriler gösterilir.</p>
        <form onSubmit={search}>
            <fieldset disabled={loading} className="registration-fields">
                <legend>Müşteri ara</legend>
                <label htmlFor="customerName">Ad</label><input id="customerName" maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label htmlFor="customerSurname">Soyad</label><input id="customerSurname" maxLength={100} value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} />
                <label htmlFor="customerEmail">E-posta</label><input id="customerEmail" type="text" inputMode="email" maxLength={100} placeholder="E-postanın bir bölümünü yazabilirsin" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label htmlFor="customerPhone">Telefon</label><input id="customerPhone" type="tel" maxLength={100} value={form.telNo} onChange={e => setForm({ ...form, telNo: e.target.value })} />
                <label htmlFor="customerActive">Hesap durumu</label><select id="customerActive" value={form.active} onChange={e => setForm({ ...form, active: e.target.value })}>
                    <option value="">Tümü</option><option value="true">Aktif</option><option value="false">Pasif</option>
                </select>
                <div><button type="submit">Ara</button><button type="button" onClick={reset}>Filtreleri temizle</button></div>
            </fieldset>
        </form>
        {loading ? <p role="status">Müşteriler yükleniyor...</p> : error ? <div role="alert"><p>{error}</p><button onClick={retry}>Tekrar dene</button></div>
            : result && <>
                {result.totalElements === 0 ? <p>{Object.keys(request.filters).length ? "Aramana uygun müşteri bulunamadı." : "Henüz müşteri kaydı yok."}</p> : <>
                    <p role="status">Toplam {result.totalElements} müşteri</p>
                    <div className="staff-table-container"><table>
                        <caption>Müşteri listesi</caption>
                        <thead><tr><th>ID</th><th>Ad</th><th>Soyad</th><th>E-posta</th><th>Telefon</th><th>Yaş</th><th>Durum</th><th>İşlem</th></tr></thead>
                        <tbody>{result.content.map(user => <tr key={user.id}>
                            <td>{user.id}</td><td>{user.name}</td><td>{user.surname}</td><td>{user.email}</td><td>{user.telNo}</td><td>{user.age}</td><td>{user.active ? "Aktif" : "Pasif"}</td>
                            <td>{user.active ? <Link href={`/shipments?senderId=${user.id}`}>Adına gönderi oluştur</Link> : "Pasif hesap"}</td>
                        </tr>)}</tbody>
                    </table></div>
                    <button disabled={request.page === 0} onClick={() => changePage(request.page - 1)}>Önceki</button>
                    <span>Sayfa {result.number + 1} / {result.totalPages}</span>
                    <button disabled={request.page + 1 >= result.totalPages} onClick={() => changePage(request.page + 1)}>Sonraki</button>
                </>}
            </>}
    </main>;
}

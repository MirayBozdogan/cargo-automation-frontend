"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { type Staff, type StaffPage, type StaffSubmission } from "@/lib/staff";
import { useAuth } from "../components/AuthProvider";
import StaffForm from "./StaffForm";

function message(error: unknown, fallback: string) {
    return axios.isAxiosError<{ message: string }>(error) ? error.response?.data?.message || fallback : fallback;
}
export default function StaffPage() {
    const { user, loading, error, reload } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !error && !user) router.replace("/");
    }, [loading, error, user, router]);
    if (loading) return <main><p role="status">Yetkiler kontrol ediliyor...</p></main>;
    if (error) return <main><p role="alert">{error}</p><button onClick={reload}>Tekrar dene</button></main>;
    if (!user) return <main><p role="status">Giriş ekranına yönlendiriliyor...</p></main>;
    if (user.role !== "ADMIN") return <main><h1>Personel Yönetimi</h1><p role="alert">Bu sayfaya yalnız yöneticiler erişebilir.</p></main>;
    return <StaffManagement key={user.id} />;
}
function StaffManagement() {
    const [page, setPage] = useState(0);
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<StaffPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [listError, setListError] = useState("");
    const [operationError, setOperationError] = useState("");
    const [success, setSuccess] = useState("");
    const [formVisible, setFormVisible] = useState(false);
    const [editing, setEditing] = useState<Staff | null>(null);
    useEffect(() => {
        let active = true;
        api.get<StaffPage>("/staff", { params: { page, size: 10, sort: "id,desc" } })
            .then(response => {
                if (!active) return;
                if (page > 0 && page >= response.data.totalPages) { setPage(Math.max(0, response.data.totalPages - 1)); return; }
                setResult(response.data); setListError(""); setLoading(false);
            })
            .catch(error => { if (active) { setListError(message(error, "Personel listesi yüklenemedi.")); setLoading(false); } });
        return () => { active = false; };
    }, [page, revision]);
    function refresh() { setLoading(true); setListError(""); setRevision(value => value + 1); }
    function changePage(next: number) { setLoading(true); setListError(""); setPage(next); }
    async function beginEdit(staff: Staff) {
        if (busy) return;
        setBusy(true); setOperationError(""); setSuccess("");
        try {
            const response = await api.get<Staff>(`/staff/${staff.id}`);
            setEditing(response.data); setFormVisible(true);
        } catch (error) { setOperationError(message(error, "Personel bilgileri alınamadı.")); }
        finally { setBusy(false); }
    }
    async function save(submission: StaffSubmission) {
        if (busy) return;
        setBusy(true); setOperationError(""); setSuccess("");
        try {
            if (editing) {
                await api.put<Staff>(`/staff/${editing.id}`, submission.details);
                setSuccess("Personel bilgileri güncellendi.");
            } else {
                await api.post<Staff>("/staff", { ...submission.details, password: submission.password });
                setSuccess("Personel eklendi."); setPage(0);
            }
            setFormVisible(false); setEditing(null); refresh();
        } finally { setBusy(false); }
    }
    async function toggleActivity(staff: Staff) {
        if (busy) return;
        const active = !staff.active;
        if (!confirm(`${staff.name} ${staff.surname} ${active ? "aktif" : "pasif"} yapılsın mı?${active ? "" : " Personelin mevcut oturumuyla erişimi de engellenecek."}`)) return;
        setBusy(true); setOperationError(""); setSuccess("");
        try {
            await api.patch<Staff>(`/staff/${staff.id}/active`, { active });
            setSuccess(`Personel ${active ? "aktif" : "pasif"} yapıldı.`); refresh();
        } catch (error) { setOperationError(message(error, "Aktiflik değiştirilemedi.")); }
        finally { setBusy(false); }
    }
    return <main>
        <h1>Personel Yönetimi</h1>
        <div className="staff-actions">
            <button disabled={busy || formVisible} onClick={() => { setEditing(null); setFormVisible(true); setOperationError(""); setSuccess(""); }}>Yeni personel ekle</button>
            <button disabled={busy || loading} onClick={refresh}>Listeyi yenile</button>
        </div>
        {success && <p role="status">{success}</p>}
        {operationError && <p role="alert" className="deleteError">{operationError}</p>}
        {formVisible && <StaffForm key={editing?.id ?? "new"} staff={editing} busy={busy} onSave={save} onCancel={() => { setFormVisible(false); setEditing(null); }} />}
        {loading ? <p role="status">Personel listesi yükleniyor...</p> : listError ? <div role="alert"><p>{listError}</p><button onClick={refresh}>Tekrar dene</button></div>
            : result && <>
                {result.totalElements === 0 ? <p>Henüz personel kaydı yok.</p> : <>
                    <p>Toplam {result.totalElements} personel</p>
                    <div className="staff-table-container"><table>
                        <caption>Aktif ve pasif personeller</caption>
                        <thead><tr><th>ID</th><th>Ad soyad</th><th>E-posta</th><th>Telefon</th><th>Durum</th><th>İşlemler</th></tr></thead>
                        <tbody>{result.content.map(staff => <tr key={staff.id}>
                            <td>{staff.id}</td><td>{staff.name} {staff.surname}</td><td>{staff.email}</td><td>{staff.telNo}</td><td>{staff.active ? "Aktif" : "Pasif"}</td>
                            <td><button disabled={busy || formVisible} aria-label={`${staff.name} ${staff.surname} bilgilerini düzenle`} onClick={() => beginEdit(staff)}>Düzenle</button>
                                <button disabled={busy || formVisible} aria-label={`${staff.name} ${staff.surname} ${staff.active ? "pasif" : "aktif"} yap`} onClick={() => toggleActivity(staff)}>{staff.active ? "Pasif yap" : "Aktif yap"}</button></td>
                        </tr>)}</tbody>
                    </table></div>
                    <button disabled={page === 0 || busy || formVisible} onClick={() => changePage(page - 1)}>Önceki</button>
                    <span>Sayfa {result.number + 1} / {result.totalPages}</span>
                    <button disabled={page + 1 >= result.totalPages || busy || formVisible} onClick={() => changePage(page + 1)}>Sonraki</button>
                </>}
            </>}
    </main>;
}

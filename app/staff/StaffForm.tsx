"use client";
import { useState, type FormEvent } from "react";
import axios from "axios";
import { type Staff, type StaffFormValues, type StaffSubmission } from "@/lib/staff";

interface StaffFormProps { staff: Staff | null; busy: boolean; onSave: (submission: StaffSubmission) => Promise<void>; onCancel: () => void }
export default function StaffForm({ staff, busy, onSave, onCancel }: StaffFormProps) {
    const [form, setForm] = useState<StaffFormValues>(() => staff ? {
        name: staff.name, surname: staff.surname, email: staff.email, age: String(staff.age), tc: staff.tc, telNo: staff.telNo,
    } : { name: "", surname: "", email: "", age: "18", tc: "", telNo: "" });
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        setError("");
        if (!form.name.trim() || !form.surname.trim()) { setError("Ad ve soyad boş olamaz."); return; }
        if (!staff && password !== confirmation) { setError("Şifreler eşleşmiyor."); return; }
        if (!staff && new TextEncoder().encode(password).length > 72) { setError("Şifre UTF-8 biçiminde 72 baytı geçemez."); return; }
        try {
            await onSave({ details: { ...form, name: form.name.trim(), surname: form.surname.trim(), email: form.email.trim(), age: Number(form.age) },
                ...(!staff ? { password } : {}) });
        } catch (error) {
            setError(axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message || "Personel kaydedilemedi." : "Personel kaydedilemedi.");
        }
    }
    return <section className="staff-form-panel" aria-label={staff ? "Personel düzenle" : "Personel ekle"}>
        <h2>{staff ? `${staff.name} ${staff.surname} — Bilgileri düzenle` : "Yeni personel ekle"}</h2>
        <p>{staff ? "Bu form şifreyi, rolü ve aktifliği değiştirmez. E-posta değişirse personel yeniden giriş yapmalıdır." : "Yeni hesap aktif personel olarak oluşturulur."}</p>
        <form onSubmit={handleSubmit}>
            <fieldset disabled={busy} className="registration-fields">
                <label htmlFor="staffName">Ad</label><input id="staffName" required maxLength={100} autoComplete="off" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <label htmlFor="staffSurname">Soyad</label><input id="staffSurname" required maxLength={100} autoComplete="off" value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} />
                <label htmlFor="staffEmail">E-posta</label><input id="staffEmail" required type="email" autoComplete="off" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label htmlFor="staffAge">Yaş</label><input id="staffAge" required type="number" min={18} max={2147483647} step={1} value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                <label htmlFor="staffTc">TC kimlik numarası</label><input id="staffTc" required inputMode="numeric" pattern="[0-9]{11}" maxLength={11} value={form.tc} onChange={e => setForm({ ...form, tc: e.target.value })} />
                <label htmlFor="staffPhone">Telefon</label><input id="staffPhone" required type="tel" pattern="05[0-9]{9}" maxLength={11} placeholder="05XXXXXXXXX" autoComplete="off" value={form.telNo} onChange={e => setForm({ ...form, telNo: e.target.value })} />
                {!staff && <>
                    <label htmlFor="staffPassword">İlk giriş şifresi (en az 6 karakter)</label><input id="staffPassword" required type="password" autoComplete="new-password" minLength={6} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} />
                    <label htmlFor="staffPasswordConfirmation">Şifre tekrar</label><input id="staffPasswordConfirmation" required type="password" autoComplete="new-password" minLength={6} maxLength={72} value={confirmation} onChange={e => setConfirmation(e.target.value)} />
                </>}
                {error && <p role="alert" className="deleteError">{error}</p>}
                <div><button type="submit">{busy ? "Kaydediliyor..." : staff ? "Değişiklikleri kaydet" : "Personeli ekle"}</button>
                    <button type="button" onClick={onCancel}>Vazgeç</button></div>
            </fieldset>
        </form>
    </section>;
}

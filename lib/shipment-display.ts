export const statusLabels = {
    CREATED: "Oluşturuldu",
    ACCEPTED: "Kabul edildi",
    READY_FOR_DISTRIBUTION: "Dağıtıma hazır",
    OUT_FOR_DELIVERY: "Dağıtımda",
    DELIVERED: "Teslim edildi",
} as const;
export const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
export const dateFormat = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" });
export function fullName(name: string | null, surname: string | null) {
    return [name, surname].filter(Boolean).join(" ") || "—";
}

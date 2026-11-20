import { dateFormat, statusLabels, statusOrder, type ShipmentStatus } from "@/lib/shipment-display";
import styles from "./StatusTimeline.module.css";

interface Props {
    status: ShipmentStatus;
    createdAt: string | null;
    deliveredAt: string | null;
    courierName: string | null;
}
type StepState = "done" | "current" | "next" | "upcoming";

const hints: Record<ShipmentStatus, string> = {
    CREATED: "Gönderi kaydı açıldı",
    ACCEPTED: "Personel gönderiyi kabul etti",
    READY_FOR_DISTRIBUTION: "Paket dağıtıma hazırlandı",
    OUT_FOR_DELIVERY: "Kurye atandı, gönderi yolda",
    DELIVERED: "Alıcıya teslim edildi",
};
const stateText: Record<StepState, string> = {
    done: "tamamlandı", current: "şu anki durum", next: "sıradaki adım", upcoming: "bekliyor",
};

function Check() {
    return <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
        <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}
function time(value: string) {
    return <time dateTime={value}>{dateFormat.format(new Date(value))}</time>;
}

// Backend yalnız oluşturma ve teslim zamanını saklar; diğer adımlar için zaman uydurulmaz.
export default function StatusTimeline({ status, createdAt, deliveredAt, courierName }: Props) {
    const reached = statusOrder.indexOf(status);
    return <ol className={styles.timeline} aria-label="Gönderi durumu">
        {statusOrder.map((step, index) => {
            const state: StepState = index < reached ? "done" : index === reached ? "current"
                : index === reached + 1 ? "next" : "upcoming";
            const detail = step === "CREATED" && createdAt ? time(createdAt)
                : step === "DELIVERED" && deliveredAt ? time(deliveredAt)
                    : step === "OUT_FOR_DELIVERY" && index <= reached && courierName ? `Kurye: ${courierName}`
                        : state === "next" ? "Sıradaki adım"
                            : state === "upcoming" ? "Bekliyor" : hints[step];
            return <li key={step} className={`${styles.step} ${styles[state]}`} aria-current={state === "current" ? "step" : undefined}>
                <span className={styles.marker} aria-hidden="true">{index <= reached ? <Check /> : index + 1}</span>
                <span className={styles.label}>{statusLabels[step]}<span className={styles.srOnly}> ({stateText[state]})</span></span>
                <span className={styles.detail}>{detail}</span>
            </li>;
        })}
    </ol>;
}

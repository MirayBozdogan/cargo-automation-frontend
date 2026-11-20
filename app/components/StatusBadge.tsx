import { statusLabels, type ShipmentStatus } from "@/lib/shipment-display";
import styles from "./StatusBadge.module.css";

const tone: Record<ShipmentStatus, string> = {
    CREATED: styles.created,
    ACCEPTED: styles.accepted,
    READY_FOR_DISTRIBUTION: styles.ready,
    OUT_FOR_DELIVERY: styles.out,
    DELIVERED: styles.delivered,
};

// Her durumun kendi rengi var; metin her zaman görünür, renk yalnız ek ipucudur.
export default function StatusBadge({ status }: { status: ShipmentStatus }) {
    return <span className={`${styles.badge} ${tone[status] ?? ""}`}>{statusLabels[status] ?? "Bilinmeyen durum"}</span>;
}

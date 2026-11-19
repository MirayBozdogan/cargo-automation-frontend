import { describe, expect, test } from "vitest";
import { currency, fullName, statusLabels } from "./shipment-display";

describe("gönderi gösterim yardımcıları", () => {
    test("ad ve soyadı birleştirir, eksikleri atlar", () => {
        expect(fullName("Ayşe", "Yılmaz")).toBe("Ayşe Yılmaz");
        expect(fullName("Ayşe", null)).toBe("Ayşe");
        expect(fullName(null, null)).toBe("—");
    });

    test("beş gönderi durumunun hepsinin Türkçe karşılığı var", () => {
        expect(Object.keys(statusLabels)).toEqual([
            "CREATED", "ACCEPTED", "READY_FOR_DISTRIBUTION", "OUT_FOR_DELIVERY", "DELIVERED",
        ]);
    });

    test("ücreti Türk lirası olarak biçimlendirir", () => {
        expect(currency.format(80)).toContain("80,00");
        expect(currency.format(80)).toContain("₺");
    });
});

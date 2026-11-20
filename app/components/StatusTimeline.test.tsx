import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import StatusTimeline from "./StatusTimeline";
import StatusBadge from "./StatusBadge";

const createdAt = "2026-11-20T08:15:00Z";
const deliveredAt = "2026-11-21T13:40:00Z";

function steps() {
    return within(screen.getByRole("list", { name: "Gönderi durumu" })).getAllByRole("listitem");
}

describe("gönderi zaman çizelgesi", () => {
    afterEach(cleanup);

    test("beş adımı backend sırasıyla gösterir", () => {
        render(<StatusTimeline status="CREATED" createdAt={createdAt} deliveredAt={null} courierName={null} />);
        expect(steps().map(step => step.textContent)).toEqual([
            expect.stringContaining("Oluşturuldu"),
            expect.stringContaining("Kabul edildi"),
            expect.stringContaining("Dağıtıma hazır"),
            expect.stringContaining("Dağıtımda"),
            expect.stringContaining("Teslim edildi"),
        ]);
    });

    test("şu anki adımı işaretler, sıradaki ve bekleyen adımları ayırır", () => {
        render(<StatusTimeline status="ACCEPTED" createdAt={createdAt} deliveredAt={null} courierName={null} />);
        const [created, accepted, ready, out] = steps();
        expect(created.textContent).toContain("(tamamlandı)");
        expect(accepted.getAttribute("aria-current")).toBe("step");
        expect(accepted.textContent).toContain("(şu anki durum)");
        expect(ready.textContent).toContain("Sıradaki adım");
        expect(out.textContent).toContain("Bekliyor");
        expect(steps().filter(step => step.getAttribute("aria-current"))).toHaveLength(1);
    });

    test("yalnız backend'in sakladığı zamanları ve atanan kuryeyi gösterir", () => {
        render(<StatusTimeline status="DELIVERED" createdAt={createdAt} deliveredAt={deliveredAt} courierName="Kerem Aydın" />);
        const [created, accepted, , out, delivered] = steps();
        expect(created.querySelector("time")?.getAttribute("dateTime")).toBe(createdAt);
        expect(accepted.querySelector("time")).toBeNull();
        expect(out.textContent).toContain("Kurye: Kerem Aydın");
        expect(delivered.querySelector("time")?.getAttribute("dateTime")).toBe(deliveredAt);
        expect(delivered.getAttribute("aria-current")).toBe("step");
    });

    test("kurye henüz atanmadıysa kurye adı yazmaz", () => {
        render(<StatusTimeline status="READY_FOR_DISTRIBUTION" createdAt={createdAt} deliveredAt={null} courierName={null} />);
        expect(steps()[3].textContent).not.toContain("Kurye:");
        expect(steps()[3].textContent).toContain("Sıradaki adım");
    });
});

describe("durum rozeti", () => {
    afterEach(cleanup);

    test("durumun Türkçe adını gösterir", () => {
        render(<StatusBadge status="OUT_FOR_DELIVERY" />);
        expect(screen.getByText("Dağıtımda")).toBeTruthy();
    });
});

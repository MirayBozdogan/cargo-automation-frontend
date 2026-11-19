import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { CurrentUser } from "../components/AuthProvider";

const router = { replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
let auth: { user: CurrentUser | null; loading: boolean; error: string };
vi.mock("../components/AuthProvider", () => ({
    useAuth: () => ({ ...auth, logout: vi.fn(), reload: vi.fn() }),
}));

import ProfilePage from "./page";

const customer: CurrentUser = {
    id: 5, name: "Ayşe", surname: "Yılmaz", email: "ayse@example.com", age: 30,
    tc: null, telNo: null, role: "USER", active: true,
};

describe("profil ekranı", () => {
    afterEach(() => { cleanup(); router.replace.mockReset(); });

    test("kendi bilgilerini düzenleme bağlantısını gösterir", () => {
        auth = { user: customer, loading: false, error: "" };
        render(<ProfilePage />);
        expect(screen.getByRole("link", { name: "Bilgilerimi düzenle" }).getAttribute("href")).toBe("/users/5/edit");
        expect(screen.getByRole("link", { name: "Gönderilerim" }).getAttribute("href")).toBe("/users/5");
    });

    test("personel yönetimi bağlantısı yalnız yöneticiye görünür", () => {
        auth = { user: customer, loading: false, error: "" };
        const { unmount } = render(<ProfilePage />);
        expect(screen.queryByRole("link", { name: "Personel Yönetimi" })).toBeNull();
        unmount();
        auth = { user: { ...customer, role: "ADMIN" }, loading: false, error: "" };
        render(<ProfilePage />);
        expect(screen.getByRole("link", { name: "Personel Yönetimi" })).toBeTruthy();
    });

    test("oturum yoksa giriş ekranına yönlendirir", () => {
        auth = { user: null, loading: false, error: "" };
        render(<ProfilePage />);
        expect(router.replace).toHaveBeenCalledWith("/");
    });
});

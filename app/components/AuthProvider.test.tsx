import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const router = { replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/profile" }));
const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api", () => ({
    default: { get: (...args: unknown[]) => get(...args), post: (...args: unknown[]) => post(...args) },
}));

import { AuthProvider, useAuth } from "./AuthProvider";

function Probe() {
    const { user, loading, logout } = useAuth();
    if (loading) return <p>yükleniyor</p>;
    return <div><p>{user ? `kullanıcı:${user.email}` : "misafir"}</p><button onClick={logout}>çık</button></div>;
}

describe("AuthProvider", () => {
    afterEach(() => { cleanup(); localStorage.clear(); get.mockReset(); post.mockReset(); router.replace.mockReset(); });

    test("oturum işareti yoksa backend'e sormadan misafir kabul eder", async () => {
        render(<AuthProvider><Probe /></AuthProvider>);
        expect(await screen.findByText("misafir")).toBeTruthy();
        expect(get).not.toHaveBeenCalled();
    });

    test("oturum işareti varsa kullanıcıyı /users/me ile çerez üzerinden okur", async () => {
        localStorage.setItem("signedIn", "1");
        get.mockResolvedValue({ data: { id: 5, email: "ayse@example.com", role: "USER" } });
        render(<AuthProvider><Probe /></AuthProvider>);
        expect(await screen.findByText("kullanıcı:ayse@example.com")).toBeTruthy();
        expect(get).toHaveBeenCalledWith("/users/me");
    });

    test("çıkış backend'den çerezi sildirir, işareti kaldırır ve giriş ekranına döner", async () => {
        localStorage.setItem("signedIn", "1");
        get.mockResolvedValue({ data: { id: 5, email: "ayse@example.com", role: "USER" } });
        post.mockResolvedValue({ status: 204 });
        render(<AuthProvider><Probe /></AuthProvider>);
        await screen.findByText("kullanıcı:ayse@example.com");
        await act(async () => { fireEvent.click(screen.getByRole("button", { name: "çık" })); });
        expect(post).toHaveBeenCalledWith("/auth/logout");
        expect(localStorage.getItem("signedIn")).toBeNull();
        expect(router.replace).toHaveBeenCalledWith("/");
        await waitFor(() => expect(screen.getByText("misafir")).toBeTruthy());
    });

    test("çıkış isteği başarısız olsa da yerel oturum kapanır", async () => {
        localStorage.setItem("signedIn", "1");
        get.mockResolvedValue({ data: { id: 5, email: "ayse@example.com", role: "USER" } });
        post.mockRejectedValue(new Error("ağ hatası"));
        render(<AuthProvider><Probe /></AuthProvider>);
        await screen.findByText("kullanıcı:ayse@example.com");
        await act(async () => { fireEvent.click(screen.getByRole("button", { name: "çık" })); });
        expect(localStorage.getItem("signedIn")).toBeNull();
        expect(router.replace).toHaveBeenCalledWith("/");
    });
});

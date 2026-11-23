import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const router = { replace: vi.fn(), push: vi.fn() };
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
    useRouter: () => router,
    useSearchParams: () => searchParams,
}));
const post = vi.fn();
vi.mock("@/lib/api", () => ({ default: { post: (...args: unknown[]) => post(...args) } }));

import LoginPage from "./page";
import { AxiosError } from "axios";

function fillAndSubmit() {
    fireEvent.change(screen.getByLabelText("E-posta"), { target: { value: " musteri@example.com " } });
    fireEvent.change(screen.getByLabelText("Şifre"), { target: { value: "dogru-sifre-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Giriş Yap" }));
}

describe("giriş ekranı", () => {
    beforeEach(() => { searchParams = new URLSearchParams(); });
    afterEach(() => { cleanup(); localStorage.clear(); post.mockReset(); router.replace.mockReset(); });

    test("şifremi unuttum bağlantısını gösterir", () => {
        render(<LoginPage />);
        expect(screen.getByRole("link", { name: "Şifremi unuttum" }).getAttribute("href")).toBe("/forgot-password");
    });

    test("başarılı girişte token saklamaz, oturum işareti koyup profile gider", async () => {
        post.mockResolvedValue({ data: { message: "Giriş başarılı." } });
        render(<LoginPage />);
        fillAndSubmit();
        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/profile"));
        expect(post).toHaveBeenCalledWith("/auth/login", { email: "musteri@example.com", password: "dogru-sifre-123" });
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("signedIn")).toBe("1");
    });

    test("hatalı girişte backend mesajını gösterir ve yönlendirmez", async () => {
        post.mockRejectedValue(new AxiosError("401", "401", undefined, null,
            { data: { message: "Email veya şifre hatalı." }, status: 401, statusText: "", headers: {}, config: {} as never }));
        render(<LoginPage />);
        fillAndSubmit();
        expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Email veya şifre hatalı.");
        expect(router.replace).not.toHaveBeenCalled();
        expect(localStorage.getItem("signedIn")).toBeNull();
    });

    test("oturum süresi dolduysa bilgi mesajı görünür", () => {
        searchParams = new URLSearchParams("session=expired");
        render(<LoginPage />);
        expect(screen.getByRole("status").textContent).toContain("Oturumun sona erdi");
    });
});

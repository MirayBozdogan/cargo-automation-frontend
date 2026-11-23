import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AxiosError } from "axios";

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }));
const post = vi.fn();
vi.mock("@/lib/api", () => ({ default: { post: (...args: unknown[]) => post(...args) } }));

import ResetPasswordPage from "./page";

function submit(next: string, repeat: string) {
    fireEvent.change(screen.getByLabelText("Yeni şifre"), { target: { value: next } });
    fireEvent.change(screen.getByLabelText("Yeni şifre (tekrar)"), { target: { value: repeat } });
    fireEvent.click(screen.getByRole("button", { name: "Şifreyi değiştir" }));
}

describe("yeni şifre ekranı", () => {
    beforeEach(() => { searchParams = new URLSearchParams("token=abc123"); localStorage.setItem("signedIn", "1"); });
    afterEach(() => { cleanup(); post.mockReset(); localStorage.clear(); });

    test("bağlantıdaki anahtarla yeni şifreyi gönderir ve oturum işaretini temizler", async () => {
        post.mockResolvedValue({ data: { message: "Şifren değiştirildi. Yeni şifrenle giriş yapabilirsin." } });
        render(<ResetPasswordPage />);
        submit("yeni-sifre-2", "yeni-sifre-2");
        expect((await screen.findByRole("status")).textContent).toContain("Şifren değiştirildi");
        expect(post).toHaveBeenCalledWith("/auth/reset-password", { token: "abc123", newPassword: "yeni-sifre-2" });
        expect(screen.getByRole("link", { name: "Giriş yap" }).getAttribute("href")).toBe("/");
        expect(localStorage.getItem("signedIn")).toBeNull();
    });

    test("şifreler farklıysa istek atmaz", () => {
        render(<ResetPasswordPage />);
        submit("yeni-sifre-2", "yeni-sifre-3");
        expect(screen.getByRole("alert").textContent).toBe("Yeni şifreler birbiriyle aynı değil.");
        expect(post).not.toHaveBeenCalled();
    });

    test("geçersiz bağlantıda mesajı ve yeni bağlantı isteme yolunu gösterir", async () => {
        const error = new AxiosError("Bad Request");
        error.response = { status: 400, data: { message: "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin." } } as never;
        post.mockRejectedValue(error);
        render(<ResetPasswordPage />);
        submit("yeni-sifre-2", "yeni-sifre-2");
        expect((await screen.findByRole("alert")).textContent).toContain("süresi dolmuş");
        expect(screen.getByRole("link", { name: "Yeni bağlantı iste" }).getAttribute("href")).toBe("/forgot-password");
    });

    test("anahtar yoksa formu göstermez", () => {
        searchParams = new URLSearchParams();
        render(<ResetPasswordPage />);
        expect(screen.queryByLabelText("Yeni şifre")).toBeNull();
        expect(screen.getByRole("link", { name: "Yeni bağlantı iste" })).toBeTruthy();
    });
});

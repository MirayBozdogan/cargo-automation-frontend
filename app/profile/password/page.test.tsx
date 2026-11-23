import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CurrentUser } from "../../components/AuthProvider";

const router = { replace: vi.fn(), push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
let auth: { user: CurrentUser | null; loading: boolean; error: string };
vi.mock("../../components/AuthProvider", () => ({ useAuth: () => ({ ...auth, reload: vi.fn() }) }));
const put = vi.fn();
vi.mock("@/lib/api", () => ({ default: { put: (...args: unknown[]) => put(...args) } }));

import ChangePasswordPage from "./page";

const customer: CurrentUser = {
    id: 5, name: "Ayşe", surname: "Yılmaz", email: "ayse@example.com", age: 30,
    tc: null, telNo: null, role: "USER", active: true,
};

function fill(current: string, next: string, repeat: string) {
    fireEvent.change(screen.getByLabelText("Mevcut şifre"), { target: { value: current } });
    fireEvent.change(screen.getByLabelText("Yeni şifre"), { target: { value: next } });
    fireEvent.change(screen.getByLabelText("Yeni şifre (tekrar)"), { target: { value: repeat } });
    fireEvent.click(screen.getByRole("button", { name: "Şifreyi değiştir" }));
}

describe("şifre değiştirme ekranı", () => {
    beforeEach(() => { auth = { user: customer, loading: false, error: "" }; });
    afterEach(() => { cleanup(); put.mockReset(); router.replace.mockReset(); });

    test("mevcut ve yeni şifreyi gönderir, tekrar alanını göndermez", async () => {
        put.mockResolvedValue({ data: { message: "Şifreniz değiştirildi." } });
        render(<ChangePasswordPage />);
        fill("eski-sifre-1", "yeni-sifre-2", "yeni-sifre-2");
        expect(await screen.findByText(/Şifren değiştirildi. Diğer cihazlardaki oturumların kapatıldı/)).toBeTruthy();
        expect(put).toHaveBeenCalledWith("/users/me/password", { currentPassword: "eski-sifre-1", newPassword: "yeni-sifre-2" });
        expect((screen.getByLabelText("Mevcut şifre") as HTMLInputElement).value).toBe("");
    });

    test("yeni şifreler farklıysa istek atmaz", () => {
        render(<ChangePasswordPage />);
        fill("eski-sifre-1", "yeni-sifre-2", "yeni-sifre-3");
        expect(screen.getByRole("alert").textContent).toBe("Yeni şifreler birbiriyle aynı değil.");
        expect(put).not.toHaveBeenCalled();
    });

    test("sunucunun hata mesajını gösterir", async () => {
        const { AxiosError } = await import("axios");
        const error = new AxiosError("Bad Request");
        error.response = { status: 400, data: { message: "Mevcut şifre hatalı." } } as never;
        put.mockRejectedValue(error);
        render(<ChangePasswordPage />);
        fill("yanlis", "yeni-sifre-2", "yeni-sifre-2");
        await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Mevcut şifre hatalı."));
    });

    test("oturum yoksa giriş ekranına yönlendirir", () => {
        auth = { user: null, loading: false, error: "" };
        render(<ChangePasswordPage />);
        expect(router.replace).toHaveBeenCalledWith("/");
    });
});

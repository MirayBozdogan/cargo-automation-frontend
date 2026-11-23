import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AxiosError } from "axios";

const post = vi.fn();
vi.mock("@/lib/api", () => ({ default: { post: (...args: unknown[]) => post(...args) } }));

import ForgotPasswordPage from "./page";

function submit(email: string) {
    fireEvent.change(screen.getByLabelText("E-posta"), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Bağlantı gönder" }));
}

describe("şifremi unuttum ekranı", () => {
    afterEach(() => { cleanup(); post.mockReset(); });

    test("e-postayı kırpıp gönderir ve sunucunun genel mesajını gösterir", async () => {
        post.mockResolvedValue({ data: { message: "Bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderildi." } });
        render(<ForgotPasswordPage />);
        submit(" ayse@example.com ");
        expect((await screen.findByRole("status")).textContent).toContain("kayıtlı bir hesap varsa");
        expect(post).toHaveBeenCalledWith("/auth/forgot-password", { email: "ayse@example.com" });
        expect(screen.queryByLabelText("E-posta")).toBeNull();
    });

    test("sunucu hatasını gösterir", async () => {
        const error = new AxiosError("Bad Request");
        error.response = { status: 400, data: { message: "Geçerli bir e-posta adresi giriniz." } } as never;
        post.mockRejectedValue(error);
        render(<ForgotPasswordPage />);
        submit("ayse@example.com");
        expect((await screen.findByRole("alert")).textContent).toBe("Geçerli bir e-posta adresi giriniz.");
    });
});

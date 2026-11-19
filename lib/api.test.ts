import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import api, { API_URL } from "./api";
import { hasSessionHint, markSignedIn } from "./session";

// Ağa çıkmadan her isteğe verilecek yanıtı belirleyen sahte adapter.
function respondWith(status: number) {
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
        const response = { data: {}, status, statusText: "", headers: {}, config };
        if (status < 400) return response;
        throw new AxiosError("hata", String(status), config, null, response);
    };
}

describe("API istemcisi", () => {
    const replace = vi.fn();
    const originalLocation = window.location;

    beforeEach(() => {
        Object.defineProperty(window, "location", {
            configurable: true,
            value: { ...originalLocation, pathname: "/profile", replace },
        });
    });
    afterEach(() => {
        Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
        localStorage.clear();
        replace.mockReset();
    });

    test("ortam değişkeni yoksa yerel backend adresini kullanır", () => {
        expect(API_URL).toBe("http://localhost:8080");
        expect(api.defaults.baseURL).toBe("http://localhost:8080");
    });

    test("çerezin gönderilmesi için withCredentials açıktır ve Authorization başlığı eklenmez", async () => {
        let seen: InternalAxiosRequestConfig | undefined;
        api.defaults.adapter = async config => {
            seen = config;
            return { data: {}, status: 200, statusText: "", headers: {}, config };
        };
        localStorage.setItem("token", "eski.jwt.degeri");
        await api.get("/users/me");
        expect(seen?.withCredentials).toBe(true);
        expect(AxiosHeaders.from(seen?.headers).get("Authorization")).toBeUndefined();
    });

    test("401 yanıtında oturum işareti silinir ve giriş ekranına dönülür", async () => {
        markSignedIn();
        respondWith(401);
        await expect(api.get("/users/me")).rejects.toBeInstanceOf(AxiosError);
        expect(hasSessionHint()).toBe(false);
        expect(replace).toHaveBeenCalledWith("/?session=expired");
    });

    test("giriş isteğindeki 401 sayfayı yönlendirmez", async () => {
        markSignedIn();
        respondWith(401);
        await expect(api.post("/auth/login", {})).rejects.toBeInstanceOf(AxiosError);
        expect(hasSessionHint()).toBe(true);
        expect(replace).not.toHaveBeenCalled();
    });

    test("403 yanıtı oturumu kapatmaz", async () => {
        markSignedIn();
        respondWith(403);
        await expect(api.get("/reports/shipments")).rejects.toBeInstanceOf(AxiosError);
        expect(hasSessionHint()).toBe(true);
        expect(replace).not.toHaveBeenCalled();
    });
});

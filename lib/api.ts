import axios from "axios";
import { clearSignedIn } from "./session";

// NEXT_PUBLIC_ değişkenleri build sırasında koda yazılır; değiştirdikten sonra
// "npm run dev" yeniden başlatılmalı veya "npm run build" tekrar çalıştırılmalıdır.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
    baseURL: API_URL,
    // Oturum çerezinin (HttpOnly) farklı porttaki API'ye gönderilmesi için gerekir.
    withCredentials: true,
});

api.interceptors.response.use(
    response => response,
    error => {
        if (typeof window !== "undefined" && axios.isAxiosError(error) &&
            error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
            clearSignedIn();
            if (window.location.pathname !== "/") window.location.replace("/?session=expired");
        }
        return Promise.reject(error);
    }
);

export default api;

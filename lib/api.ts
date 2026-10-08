
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080",
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (token && !config.url?.startsWith("/auth/")) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => response,
    error => {
        if (typeof window !== "undefined" && axios.isAxiosError(error) &&
            error.response?.status === 401 && !error.config?.url?.startsWith("/auth/")) {
            localStorage.removeItem("token");
            if (window.location.pathname !== "/") window.location.replace("/?session=expired");
        }
        return Promise.reject(error);
    }
);

export default api;

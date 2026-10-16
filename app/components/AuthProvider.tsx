"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";

export interface CurrentUser {
    id: number; name: string; surname: string; email: string;
    age: number; tc: string | null; telNo: string | null;
    role: "USER" | "STAFF" | "ADMIN"; active: boolean;
}
interface AuthSnapshot { key: string; user: CurrentUser | null; error: string }
interface AuthContextValue {
    user: CurrentUser | null; loading: boolean; error: string;
    logout: () => void; reload: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [revision, setRevision] = useState(0);
    const [snapshot, setSnapshot] = useState<AuthSnapshot | null>(null);
    const key = `${pathname}:${revision}`;
    useEffect(() => {
        let active = true;
        async function load() {
            if (!localStorage.getItem("token")) {
                if (active) setSnapshot({ key, user: null, error: "" });
                return;
            }
            try {
                const response = await api.get<CurrentUser>("/users/me");
                if (active) setSnapshot({ key, user: response.data, error: "" });
            } catch {
                if (active) setSnapshot({ key, user: null, error: "Oturum bilgileri alınamadı." });
            }
        }
        void load();
        return () => { active = false; };
    }, [key]);
    const current = snapshot?.key === key ? snapshot : null;
    function logout() {
        localStorage.removeItem("token");
        setSnapshot({ key, user: null, error: "" });
        router.replace("/");
    }
    return <AuthContext.Provider value={{
        user: current?.user ?? null, loading: !current, error: current?.error ?? "",
        logout, reload: () => setRevision(value => value + 1),
    }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
    return context;
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function UserShipmentPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [error, setError] = useState("");
    useEffect(() => {
        if (!localStorage.getItem("token")) { router.replace("/"); return; }
        let active = true;
        api.get<{ id: number }>("/users/me").then(response => {
            if (!active) return;
            if (String(response.data.id) !== id) { setError("Bu kullanıcı adına gönderi oluşturamazsınız."); return; }
            router.replace("/shipments");
        }).catch(() => { if (active) setError("Kullanıcı bilgileri doğrulanamadı."); });
        return () => { active = false; };
    }, [id, router]);
    return <main>{error ? <p role="alert">{error}</p> : <p role="status">Gönderi formuna yönlendiriliyor...</p>}</main>;
}
